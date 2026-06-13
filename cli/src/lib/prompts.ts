import { confirm, multiselect, select, isCancel, cancel } from '@clack/prompts';
import { skillNamesFromManifest, type BundleContext } from './bundle.js';
import { CliCancel, CliError } from './errors.js';
import type { InstallPlan } from './install-plan.js';
import { failNonInteractive } from './output.js';

export async function promptLinkType(
  isTty: boolean,
  flags: { copy?: boolean; symlink?: boolean },
): Promise<'symlink' | 'copy'> {
  if (flags.copy) return 'copy';
  if (flags.symlink) return 'symlink';
  if (!isTty) {
    return 'symlink';
  }

  const choice = await select({
    message: 'Materialize skills as (↑↓ to move, enter to select)',
    options: [
      { value: 'symlink', label: 'Symlink (recommended)' },
      { value: 'copy', label: 'Copy' },
    ],
    initialValue: 'symlink',
  });

  if (isCancel(choice)) {
    cancel('Cancelled.');
    throw new CliCancel();
  }

  return choice as 'symlink' | 'copy';
}

export async function promptSkillSelection(
  bundle: BundleContext,
  isTty: boolean,
  flags: { skills?: string[]; all?: boolean },
): Promise<string[]> {
  if (flags.all) {
    return skillNamesFromManifest(bundle.manifest);
  }
  if (flags.skills && flags.skills.length > 0) {
    return flags.skills;
  }

  if (!isTty) {
    failNonInteractive('Specify skills with --skill <name> (repeatable) or --all.');
  }

  const names = skillNamesFromManifest(bundle.manifest);
  const selected = await multiselect({
    message: 'Select skill(s) to install (space to select, a to toggle all, enter to confirm)',
    options: names.map((name) => ({ value: name, label: name })),
    required: true,
  });

  if (isCancel(selected)) {
    cancel('Cancelled.');
    throw new CliCancel();
  }

  if (!selected.length) {
    throw new CliError('No skills selected.');
  }

  return selected as string[];
}

export async function promptOrphanRemoval(orphanNames: string[]): Promise<string[]> {
  if (orphanNames.length === 0) {
    return [];
  }

  const selected = await multiselect({
    message: 'Remove skills no longer in the pack? (deselect to keep)',
    options: orphanNames.map((name) => ({ value: name, label: name })),
    initialValues: orphanNames,
    required: false,
  });

  if (isCancel(selected)) {
    cancel('Cancelled.');
    throw new CliCancel();
  }

  return selected as string[];
}

export type ConfirmAction = 'install' | 'update';

const CONFIRM_MESSAGES: Record<ConfirmAction, string> = {
  install: 'Proceed with installation?',
  update: 'Proceed with update?',
};

export function planProceedMessage(plan: InstallPlan): string | null {
  let installCount = 0;
  let confirmCount = 0;

  for (const entry of plan.entries) {
    if (entry.action === 'skip') continue;
    if (entry.action === 'confirm') {
      confirmCount += 1;
    } else {
      installCount += 1;
    }
  }

  if (installCount === 0 && confirmCount === 0) {
    return null;
  }
  if (confirmCount > 0 && installCount > 0) {
    return `Install ${installCount} skill(s) and overwrite ${confirmCount} with bundle content?`;
  }
  if (confirmCount > 0) {
    return `Overwrite ${confirmCount} skill(s) with bundle content?`;
  }
  return CONFIRM_MESSAGES.install;
}

export async function confirmInstallPlan(
  plan: InstallPlan,
  opts: { autoYes: boolean },
): Promise<boolean> {
  const message = planProceedMessage(plan);
  if (message === null) {
    return false;
  }
  if (opts.autoYes) {
    return true;
  }

  const ok = await confirm({
    message,
    initialValue: true,
  });

  if (isCancel(ok)) {
    cancel('Cancelled.');
    throw new CliCancel();
  }

  return ok === true;
}

export async function confirmProceed(opts: {
  action: ConfirmAction;
  autoYes: boolean;
  message?: string;
}): Promise<boolean> {
  if (opts.autoYes) {
    return true;
  }

  const ok = await confirm({
    message: opts.message ?? CONFIRM_MESSAGES[opts.action],
    initialValue: true,
  });

  if (isCancel(ok)) {
    cancel('Cancelled.');
    throw new CliCancel();
  }

  return ok === true;
}
