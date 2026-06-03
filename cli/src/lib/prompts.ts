import { confirm, multiselect, isCancel, cancel } from '@clack/prompts';
import { skillNamesFromManifest, type BundleContext } from './bundle.js';
import { CliCancel, CliError } from './errors.js';
import type { InstallPlan } from './install-plan.js';
import { failNonInteractive } from './output.js';

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
}): Promise<boolean> {
  if (opts.autoYes) {
    return true;
  }

  const ok = await confirm({
    message: CONFIRM_MESSAGES[opts.action],
    initialValue: true,
  });

  if (isCancel(ok)) {
    cancel('Cancelled.');
    throw new CliCancel();
  }

  return ok === true;
}
