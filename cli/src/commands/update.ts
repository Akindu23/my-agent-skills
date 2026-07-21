import { note, outro } from '@clack/prompts';
import {
  applyDriftPlan,
  formatUpdateConfirmMessage,
  planHasWork,
} from '../lib/apply-drift-plan.js';
import { createDriftPlan } from '../lib/drift-plan.js';
import { renderDriftSummary } from '../lib/drift-summary.js';
import {
  resolveEffectiveTargets,
  resolveTargetSkillsDir,
} from '../lib/install-targets.js';
import { printJson } from '../lib/output.js';
import { confirmProceed, promptOrphanRemoval } from '../lib/prompts.js';
import { runScopedCommand } from '../lib/run-scoped-command.js';

export interface UpdateOptions {
  global?: boolean;
  project?: boolean;
  yes?: boolean;
  source?: string;
  json?: boolean;
  cwd?: string;
  skipIntro?: boolean;
  skipDriftSummary?: boolean;
}

export async function runUpdate(opts: UpdateOptions): Promise<void> {
  const { isInteractive, scope } = await runScopedCommand(opts);
  const plan = await createDriftPlan({ scope, source: opts.source });

  const drifted = plan.entries.filter((e) => e.status === 'hashDrift');
  const orphans = plan.entries.filter((e) => e.status === 'orphan');
  const emptyPlan =
    drifted.length === 0 &&
    !plan.commitDrift &&
    !plan.manifestDrift &&
    orphans.length === 0;

  if (emptyPlan) {
    if (opts.json) {
      printJson({
        scope: scope.scope,
        updated: [],
        contentChanged: [],
        orphansRemoved: [],
        orphansSkipped: [],
        lockPath: scope.lockPath,
      });
      return;
    }
    if (!isInteractive) {
      console.log(`All skills up to date (${scope.scope}).`);
    } else {
      outro('All skills up to date.');
    }
    return;
  }

  if (isInteractive && !opts.skipDriftSummary) {
    note(renderDriftSummary(plan, { mode: 'update' }), 'Update summary');
  }

  const orphanNames = orphans.map((e) => e.name);
  let orphansToRemove: ReadonlySet<string>;
  if (orphanNames.length === 0) {
    orphansToRemove = new Set();
  } else if (opts.yes === true) {
    orphansToRemove = new Set(orphanNames);
  } else if (isInteractive) {
    orphansToRemove = new Set(await promptOrphanRemoval(orphanNames));
  } else {
    for (const name of orphanNames) {
      console.warn(`Skipping orphan skill "${name}" (not in remote pack).`);
    }
    orphansToRemove = new Set();
  }

  const hasApplyWork =
    plan.commitDrift ||
    plan.manifestDrift ||
    drifted.length > 0 ||
    orphansToRemove.size > 0;

  if (isInteractive && hasApplyWork) {
    const proceed = await confirmProceed({
      action: 'update',
      autoYes: opts.yes ?? false,
      message: formatUpdateConfirmMessage(plan),
    });
    if (!proceed) {
      outro('Cancelled. No changes made.');
      return;
    }
  }

  const result = await applyDriftPlan(plan, {
    orphansToRemove,
  });

  if (!planHasWork(plan, result)) {
    if (opts.json) {
      printJson({
        scope: scope.scope,
        updated: [],
        contentChanged: [],
        orphansRemoved: result.orphansRemoved,
        orphansSkipped: result.orphansSkipped,
        lockPath: scope.lockPath,
      });
      return;
    }
    if (isInteractive) {
      outro('No changes made.');
    }
    return;
  }

  if (opts.json) {
    printJson({
      scope: scope.scope,
      updated: result.updated,
      contentChanged: result.contentChanged,
      orphansRemoved: result.orphansRemoved,
      orphansSkipped: result.orphansSkipped,
      lockPath: scope.lockPath,
    });
    return;
  }

  if (isInteractive) {
    if (result.updated.length > 0) {
      const changed = result.contentChanged.length;
      if (plan.commitDrift && changed > 0) {
        outro(`Relinked ${result.updated.length} skill(s); ${changed} changed on remote.`);
      } else if (result.updated.length > 0) {
        outro(`Updated ${result.updated.length} skill(s).`);
      }
    } else if (result.orphansRemoved.length > 0) {
      outro(`Removed ${result.orphansRemoved.length} orphan(s).`);
    } else {
      outro('Lock synced with remote pack.');
    }
    return;
  }

  if (result.updated.length > 0) {
    const changed = result.contentChanged.length;
    const dests = resolveEffectiveTargets(plan.lock)
      .map((t) => resolveTargetSkillsDir(scope, t))
      .join(', ');
    if (plan.commitDrift && changed > 0) {
      console.log(
        `Relinked ${result.updated.length} skill(s); ${changed} changed on remote (${scope.scope})`,
      );
    } else {
      console.log(`Updated ${result.updated.length} skill(s) in ${dests} (${scope.scope})`);
    }
  } else if (plan.commitDrift || plan.manifestDrift) {
    console.log(`Synced lock with remote pack (${scope.scope})`);
  }
  console.log(`Lockfile: ${scope.lockPath}`);
}
