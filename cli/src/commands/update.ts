import { note, outro } from '@clack/prompts';
import path from 'node:path';
import {
  applyDriftPlan,
  describeInstall,
  formatUpdateConfirmMessage,
  planHasWork,
  planInstalls,
  type ApplyDriftResult,
  type InstallSet,
} from '../lib/apply-drift-plan.js';
import { createDriftPlan, type DriftPlan } from '../lib/drift-plan.js';
import { renderDriftSummary } from '../lib/drift-summary.js';
import {
  resolveEffectiveTargets,
  resolveTargetSkillsDir,
  type InstallTarget,
} from '../lib/install-targets.js';
import { pathExists } from '../lib/install.js';
import { printJson } from '../lib/output.js';
import {
  confirmProceed,
  promptAddClaudeTarget,
  promptDependencyInstall,
  promptNewSkillInstall,
  promptOrphanRemoval,
} from '../lib/prompts.js';
import { runScopedCommand } from '../lib/run-scoped-command.js';
import type { ScopePaths } from '../lib/scope.js';

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
  const missingDeps = plan.entries.filter((e) => e.status === 'missingDependency');
  const newSkills = plan.entries.filter((e) => e.status === 'newSkill');
  const addTargets =
    isInteractive && !opts.yes ? await offerClaudeTarget(plan, scope) : [];
  const emptyPlan =
    drifted.length === 0 &&
    !plan.commitDrift &&
    !plan.manifestDrift &&
    orphans.length === 0 &&
    missingDeps.length === 0 &&
    addTargets.length === 0;

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

  const gate = { yes: opts.yes === true, isInteractive };
  const orphansToRemove = await chooseAll({
    ...gate,
    candidates: orphans.map((e) => e.name),
    prompt: promptOrphanRemoval,
    skipWarning: (name) => `Skipping orphan skill "${name}" (not in remote pack).`,
  });
  const dependenciesToInstall = await chooseAll({
    ...gate,
    candidates: missingDeps.map((e) => e.name),
    prompt: () =>
      promptDependencyInstall(missingDeps.map((e) => ({ name: e.name, dependencyOf: e.dependencyOf }))),
    skipWarning: (name) => {
      const owner = missingDeps.find((e) => e.name === name)?.dependencyOf ?? 'installed skill';
      return `Skipping new dependency "${name}" (required by ${owner}); run add to install.`;
    },
  });
  const newSkillsToInstall = await chooseAll({
    ...gate,
    candidates: newSkills.map((e) => e.name),
    prompt: promptNewSkillInstall,
    skipWarning: (name) =>
      `Skipping new skill "${name}" (new in pack); it will not be offered again, run add --skill ${name} to install.`,
  });

  const installs = await planInstalls(plan, { dependenciesToInstall, newSkillsToInstall });
  for (const name of installs.unmanaged) {
    console.warn(
      `Skipping "${name}": a skills directory with that name already exists and is not in the lock; remove it or run add --skill ${name} to replace it.`,
    );
  }
  if (isInteractive && installs.items.length > 0) {
    note(installs.items.map((item) => `  + ${describeInstall(item)}`).join('\n'), 'New skills');
  }

  const hasApplyWork =
    plan.commitDrift ||
    plan.manifestDrift ||
    drifted.length > 0 ||
    orphansToRemove.size > 0 ||
    installs.items.length > 0 ||
    addTargets.length > 0;

  if (isInteractive && hasApplyWork) {
    const proceed = await confirmProceed({
      action: 'update',
      autoYes: opts.yes ?? false,
      message: formatUpdateConfirmMessage(plan, installs.items),
    });
    if (!proceed) {
      outro('Cancelled. No changes made.');
      return;
    }
  }

  const result = await applyDriftPlan(plan, {
    orphansToRemove,
    installs: installs.items,
    addTargets,
  });

  if (opts.json) {
    printJson({
      scope: scope.scope,
      updated: result.updated,
      contentChanged: result.contentChanged,
      orphansRemoved: result.orphansRemoved,
      orphansSkipped: result.orphansSkipped,
      dependenciesAdded: result.dependenciesAdded,
      dependenciesSkipped: result.dependenciesSkipped,
      newSkillsAdded: result.newSkillsAdded,
      newSkillsSkipped: result.newSkillsSkipped,
      requiredBy: result.requiredBy,
      targetsAdded: result.targetsAdded,
      unmanaged: installs.unmanaged,
      lockPath: scope.lockPath,
    });
    return;
  }

  if (!planHasWork(plan, result)) {
    if (isInteractive) {
      outro('No changes made.');
    }
    return;
  }

  const addedLines = formatAddedLines(result, installs);

  if (isInteractive) {
    if (result.targetsAdded.length > 0) {
      note(
        result.targetsAdded.map((t) => `  + ${resolveTargetSkillsDir(scope, t)}`).join('\n'),
        'New install target',
      );
    }
    if (addedLines.length > 0) {
      note(addedLines.join('\n'), 'Added');
    }
    if (result.updated.length > 0) {
      const changed = result.contentChanged.length;
      if (plan.commitDrift && changed > 0) {
        outro(`Relinked ${result.updated.length} skill(s); ${changed} changed on remote.`);
      } else if (result.updated.length > 0) {
        outro(`Updated ${result.updated.length} skill(s).`);
      }
    } else if (addedLines.length > 0) {
      outro(`Added ${addedLines.length} skill(s).`);
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
  for (const line of addedLines) {
    console.log(line);
  }
  console.log(`Lockfile: ${scope.lockPath}`);
}

/**
 * Cursor-only lock + an existing Claude Code dir (~/.claude or <cwd>/.claude):
 * ask once per run whether to start installing there too.
 */
async function offerClaudeTarget(plan: DriftPlan, scope: ScopePaths): Promise<InstallTarget[]> {
  const targets = resolveEffectiveTargets(plan.lock);
  if (targets.includes('claude') || Object.keys(plan.lock.skills).length === 0) return [];
  const claudeSkillsDir = resolveTargetSkillsDir(scope, 'claude');
  if (!(await pathExists(path.dirname(claudeSkillsDir)))) return [];
  return (await promptAddClaudeTarget(claudeSkillsDir)) ? ['claude'] : [];
}

async function chooseAll(opts: {
  candidates: string[];
  yes: boolean;
  isInteractive: boolean;
  prompt: (candidates: string[]) => Promise<string[]>;
  skipWarning: (name: string) => string;
}): Promise<ReadonlySet<string>> {
  if (opts.candidates.length === 0 || opts.yes) return new Set(opts.candidates);
  if (opts.isInteractive) return new Set(await opts.prompt(opts.candidates));
  for (const name of opts.candidates) console.warn(opts.skipWarning(name));
  return new Set();
}

function formatAddedLines(result: ApplyDriftResult, installs: InstallSet): string[] {
  const installed = new Set([...result.newSkillsAdded, ...result.dependenciesAdded]);
  return installs.items
    .filter((item) => installed.has(item.name))
    .map((item) => `Added ${describeInstall(item)}`);
}
