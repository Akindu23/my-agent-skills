import { rm } from 'node:fs/promises';
import { confirm, multiselect, isCancel, cancel, note, outro } from '@clack/prompts';
import { resolveBundle } from '../lib/bundle.js';
import {
  findInstalledDependents,
  formatRemoveDependentNote,
} from '../lib/deps.js';
import { CliCancel, CliError } from '../lib/errors.js';
import { renderRemoveSummary } from '../lib/remove-summary.js';
import {
  applyTargetsToLock,
  ensureLockParent,
  expandCliTarget,
  parseCliTarget,
  resolveEffectiveTargets,
  resolveTargetSkillsDir,
  sortUniqueTargets,
  type InstallTarget,
} from '../lib/install-targets.js';
import { readLockfile, removeSkill, writeLockfile } from '../lib/lockfile.js';
import { failNonInteractive, printJson } from '../lib/output.js';
import { assertValidSkillName, resolveSkillDestDir } from '../lib/skill-paths.js';
import { runScopedCommand } from '../lib/run-scoped-command.js';

export interface RemoveOptions {
  global?: boolean;
  project?: boolean;
  skill?: string[];
  yes?: boolean;
  source?: string;
  json?: boolean;
  skipIntro?: boolean;
  target?: string;
}

export async function runRemove(opts: RemoveOptions): Promise<void> {
  const { isInteractive, scope } = await runScopedCommand(opts);
  const lock = await readLockfile(scope.lockPath);
  if (!lock || Object.keys(lock.skills).length === 0) {
    throw new CliError('No skills in lockfile to remove.');
  }

  const effective = resolveEffectiveTargets(lock);
  const removeTargets: InstallTarget[] = opts.target
    ? expandCliTarget(parseCliTarget(opts.target))
    : effective;

  for (const t of removeTargets) {
    if (!effective.includes(t)) {
      throw new CliError(
        `Target "${t}" is not recorded in the lockfile (effective: ${effective.join(', ')}).`,
      );
    }
  }

  let names = opts.skill ?? [];
  if (names.length === 0) {
    if (!isInteractive) {
      failNonInteractive('Specify skills with --skill <name> (repeatable).');
    }
    const selected = await multiselect({
      message: 'Select skill(s) to remove (space to select, enter to confirm)',
      options: Object.keys(lock.skills).map((name) => ({ value: name, label: name })),
      required: true,
    });
    if (isCancel(selected)) {
      cancel('Cancelled.');
      throw new CliCancel();
    }
    names = selected as string[];
  }

  for (const name of names) {
    assertValidSkillName(name);
  }

  let bundle;
  try {
    bundle = await resolveBundle({ source: opts.source });
  } catch {
    bundle = undefined;
  }
  if (bundle) {
    const warnings = findInstalledDependents(
      bundle.manifest,
      Object.keys(lock.skills),
      names,
    );
    if (warnings.length > 0) {
      const noteText = formatRemoveDependentNote(warnings);
      if (isInteractive && !opts.yes) {
        note(noteText, 'Dependent skills');
        const proceed = await confirm({
          message: 'Continue removing?',
          initialValue: false,
        });
        if (isCancel(proceed)) {
          cancel('Cancelled.');
          throw new CliCancel();
        }
        if (!proceed) {
          outro('Cancelled. No changes made.');
          return;
        }
      } else {
        console.error(noteText);
      }
    }
  }

  const removed: string[] = [];
  const narrowed: string[] = [];
  const removingAllTargets =
    removeTargets.length === effective.length &&
    removeTargets.every((t) => effective.includes(t));

  for (const name of names) {
    if (!lock.skills[name]) {
      throw new CliError(`Skill not in lockfile: ${name}`);
    }
    for (const target of removeTargets) {
      await rm(
        resolveSkillDestDir(resolveTargetSkillsDir(scope, target), name),
        { recursive: true, force: true },
      );
    }
    if (removingAllTargets) {
      removeSkill(lock, name);
      removed.push(name);
    } else {
      narrowed.push(name);
    }
  }

  // Only drop targets from the lock when no other locked skills still need them.
  if (!removingAllTargets) {
    const otherSkillsRemain = Object.keys(lock.skills).some((n) => !names.includes(n));
    if (!otherSkillsRemain) {
      const remaining = sortUniqueTargets(effective.filter((t) => !removeTargets.includes(t)));
      applyTargetsToLock(lock, remaining);
    }
  }

  await ensureLockParent(scope);
  await writeLockfile(scope.lockPath, lock);

  if (opts.json) {
    printJson({
      scope: scope.scope,
      removed,
      narrowed,
      targetsRemoved: removeTargets,
      targets: resolveEffectiveTargets(lock),
      lockPath: scope.lockPath,
    });
    return;
  }

  if (isInteractive) {
    const destinations = resolveEffectiveTargets(lock).map((t) =>
      resolveTargetSkillsDir(scope, t),
    );
    note(
      renderRemoveSummary({
        scope,
        removed: removed.length > 0 ? removed : narrowed,
        destinations,
      }),
      'Remove summary',
    );
    if (removingAllTargets) {
      outro(`Removed ${removed.length} skill(s).`);
    } else {
      outro(`Removed from ${removeTargets.join(', ')}; lock kept for ${resolveEffectiveTargets(lock).join(', ')}.`);
    }
    return;
  }

  if (removingAllTargets) {
    console.log(`Removed ${removed.length} skill(s) from ${scope.scope} scope.`);
  } else {
    console.log(
      `Removed ${narrowed.length} skill(s) from ${removeTargets.join(', ')}; remaining targets: ${resolveEffectiveTargets(lock).join(', ')}.`,
    );
  }
}
