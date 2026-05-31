import { note, outro } from '@clack/prompts';
import { applyDriftPlan, planHasWork } from '../lib/apply-drift-plan.js';
import { createDriftPlan } from '../lib/drift-plan.js';
import { renderDriftSummary } from '../lib/drift-summary.js';
import { printJson } from '../lib/output.js';
import { confirmProceed } from '../lib/prompts.js';
import { runScopedCommand } from '../lib/run-scoped-command.js';

export interface UpdateOptions {
  global?: boolean;
  project?: boolean;
  yes?: boolean;
  source?: string;
  json?: boolean;
  cwd?: string;
  skipIntro?: boolean;
}

export async function runUpdate(opts: UpdateOptions): Promise<void> {
  const { isInteractive, scope } = await runScopedCommand(opts);
  const plan = await createDriftPlan({ scope, source: opts.source });

  const drifted = plan.entries.filter((e) => e.status === 'hashDrift');
  const orphans = plan.entries.filter((e) => e.status === 'orphan');
  const emptyPlan =
    drifted.length === 0 && !plan.packageDrift && orphans.length === 0;

  if (emptyPlan) {
    if (opts.json) {
      printJson({
        scope: scope.scope,
        updated: [],
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

  if (isInteractive) {
    note(renderDriftSummary(plan, { mode: 'update' }), 'Update summary');
    const proceed = await confirmProceed({ action: 'update', autoYes: opts.yes ?? false });
    if (!proceed) {
      outro('Cancelled. No changes made.');
      return;
    }
  }

  const result = await applyDriftPlan(plan, {
    orphanPolicy: 'prompt',
    isInteractive,
    autoYes: opts.yes,
  });

  if (!planHasWork(plan, result)) {
    if (opts.json) {
      printJson({
        scope: scope.scope,
        updated: [],
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
      orphansRemoved: result.orphansRemoved,
      orphansSkipped: result.orphansSkipped,
      lockPath: scope.lockPath,
    });
    return;
  }

  if (isInteractive) {
    const parts: string[] = [];
    if (result.updated.length > 0) {
      parts.push(`updated ${result.updated.length} skill(s)`);
    }
    if (result.orphansRemoved.length > 0) {
      parts.push(`removed ${result.orphansRemoved.length} orphan(s)`);
    }
    outro(parts.length > 0 ? parts.join(', ') : 'Lock package version synced.');
    return;
  }

  if (result.updated.length > 0) {
    console.log(`Updated ${result.updated.length} skill(s) in ${scope.skillsDir} (${scope.scope})`);
  } else if (plan.packageDrift) {
    console.log(`Synced package version in lock (${scope.scope})`);
  }
  console.log(`Lockfile: ${scope.lockPath}`);
}
