import { cancel, isCancel, outro, select } from '@clack/prompts';
import { showTTYIntro } from '../lib/banner.js';
import { CliCancel, CliError } from '../lib/errors.js';
import { runCommand, type CommandId } from '../lib/run-command.js';

export interface HubOptions {
  /** Keep returning to the menu after each action until Quit. */
  menu?: boolean;
}

type HubChoice = 'add' | 'update' | 'remove' | 'list' | 'sync' | 'check' | 'quit';

const HUB_MENU_MESSAGE = 'What do you want to do? (↑ or ↓ to move, enter to select)';

const hubOptions = [
  { value: 'add' as const, label: 'Add Skill(s)' },
  { value: 'update' as const, label: 'Update Existing Skill(s)' },
  { value: 'remove' as const, label: 'Remove Existing Skill(s)' },
  { value: 'list' as const, label: 'List Installed Skill(s)' },
  { value: 'sync' as const, label: 'Sync/Restore Skills from Lockfile' },
  { value: 'check' as const, label: 'Check Skill(s)' },
  { value: 'quit' as const, label: 'Quit' },
];

const skipIntro = { skipIntro: true } as const;

async function pickHubAction(): Promise<HubChoice | 'cancel'> {
  const choice = await select({
    message: HUB_MENU_MESSAGE,
    initialValue: 'add' satisfies HubChoice,
    options: hubOptions,
  });

  if (isCancel(choice)) {
    return 'cancel';
  }

  return choice as HubChoice;
}

const hubCommandOpts: Record<Exclude<HubChoice, 'quit'>, Record<string, unknown>> = {
  add: skipIntro,
  update: skipIntro,
  remove: skipIntro,
  list: skipIntro,
  sync: skipIntro,
  check: { ...skipIntro, offerUpdateOnDrift: true },
};

async function runHubAction(choice: HubChoice): Promise<void> {
  if (choice === 'quit') {
    return;
  }
  await runCommand(choice as CommandId, hubCommandOpts[choice]);
}

export async function runHub(opts: HubOptions = {}): Promise<void> {
  let showIntro = true;
  let hadFailure = false;

  for (;;) {
    if (showIntro) {
      showTTYIntro();
      showIntro = false;
    }

    const choice = await pickHubAction();

    if (choice === 'cancel') {
      cancel('Cancelled.');
      throw new CliCancel();
    }

    if (choice === 'quit') {
      outro('Goodbye.');
      if (hadFailure) {
        throw new CliError('One or more hub actions failed.');
      }
      return;
    }

    try {
      await runHubAction(choice);
      if (!opts.menu) {
        return;
      }
    } catch (err) {
      if (err instanceof CliError) {
        if (!opts.menu) {
          throw err;
        }
        hadFailure = true;
        console.error(err.message);
        showIntro = false;
        continue;
      }
      throw err;
    }
  }
}
