import { isCancel, outro, select, text } from '@clack/prompts';
import { showTTYIntro } from '../lib/banner.js';
import { CliCancel, CliError } from '../lib/errors.js';
import { installCtrlCGuard } from '../lib/keypress-guard.js';
import { runCommand, type CommandId } from '../lib/run-command.js';

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

async function runHubAction(choice: Exclude<HubChoice, 'quit'>): Promise<void> {
  await runCommand(choice as CommandId, hubCommandOpts[choice]);
}

/** Pause so the just-completed action is readable before the menu re-prints. */
async function pauseForMenu(): Promise<void> {
  // Esc/Ctrl+C here just returns to the menu (Ctrl+C is caught by the guard).
  await text({
    message: 'Press Enter to return to the menu.',
    placeholder: '',
    defaultValue: '',
  });
}

/**
 * Interactive bare-TTY hub. Menu-loop is the default: run the chosen action,
 * pause, then re-display the menu below prior output, indefinitely. The banner
 * shows once; the default highlight is always Add Skill(s).
 *
 * Key contract (see ADR-0004): the Ctrl+C guard hard-quits (exit 130) anywhere;
 * Esc inside an action surfaces as `CliCancel`, reinterpreted here as "return
 * all the way to the menu"; Esc at the menu shares the Quit item's clean-exit
 * path (exit 0, or non-zero when any action failed this session).
 */
export async function runHub(): Promise<void> {
  let showIntro = true;
  let hadFailure = false;

  const removeGuard = installCtrlCGuard();
  try {
    for (;;) {
      if (showIntro) {
        showTTYIntro();
        showIntro = false;
      }

      const choice = await pickHubAction();

      if (choice === 'cancel' || choice === 'quit') {
        outro('Goodbye.');
        if (hadFailure) {
          throw new CliError('One or more hub actions failed.');
        }
        return;
      }

      try {
        await runHubAction(choice);
      } catch (err) {
        if (err instanceof CliCancel) {
          // Esc inside an action: abandon it and return to the menu.
          continue;
        }
        if (err instanceof CliError) {
          hadFailure = true;
          console.error(err.message);
        } else {
          throw err;
        }
      }

      await pauseForMenu();
    }
  } finally {
    removeGuard();
  }
}
