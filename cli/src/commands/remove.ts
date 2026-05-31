import { rm } from 'node:fs/promises';
import { confirm, multiselect, isCancel, cancel, note, outro } from '@clack/prompts';
import { resolveBundle } from '../lib/bundle.js';
import {
  findInstalledDependents,
  formatRemoveDependentNote,
} from '../lib/deps.js';
import { CliCancel, CliError } from '../lib/errors.js';
import { renderRemoveSummary } from '../lib/remove-summary.js';
import { readLockfile, removeSkill, writeLockfile } from '../lib/lockfile.js';
import { failNonInteractive } from '../lib/output.js';
import { assertValidSkillName, resolveSkillDestDir } from '../lib/skill-paths.js';
import { ensureAgentsDir } from '../lib/scope.js';
import { runScopedCommand } from '../lib/run-scoped-command.js';
import { printJson } from '../lib/output.js';

export interface RemoveOptions {
  global?: boolean;
  project?: boolean;
  skill?: string[];
  yes?: boolean;
  source?: string;
  json?: boolean;
  skipIntro?: boolean;
}

export async function runRemove(opts: RemoveOptions): Promise<void> {
  const { isInteractive, scope } = await runScopedCommand(opts);
  const lock = await readLockfile(scope.lockPath);
  if (!lock || Object.keys(lock.skills).length === 0) {
    throw new CliError('No skills in lockfile to remove.');
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

  if (isInteractive && !opts.yes) {
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
        note(formatRemoveDependentNote(warnings), 'Dependent skills');
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
      }
    }
  }

  const removed: string[] = [];
  for (const name of names) {
    if (!lock.skills[name]) {
      throw new CliError(`Skill not in lockfile: ${name}`);
    }
    removeSkill(lock, name);
    await rm(resolveSkillDestDir(scope.skillsDir, name), { recursive: true, force: true });
    removed.push(name);
  }

  await ensureAgentsDir(scope);
  await writeLockfile(scope.lockPath, lock);

  if (opts.json) {
    printJson({ scope: scope.scope, removed, lockPath: scope.lockPath });
    return;
  }

  if (isInteractive) {
    note(renderRemoveSummary({ scope, removed }), 'Remove summary');
    outro(`Removed ${removed.length} skill(s).`);
    return;
  }

  console.log(`Removed ${removed.length} skill(s) from ${scope.scope} scope.`);
}
