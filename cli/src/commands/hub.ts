import { isCancel, outro, select, text } from '@clack/prompts';
import { showTTYIntro } from '../lib/banner.js';
import { CliCancel, CliError } from '../lib/errors.js';
import { installCtrlCGuard } from '../lib/keypress-guard.js';
import { runCommand, type CommandId } from '../lib/run-command.js';
import { brand, muted, success } from '../lib/theme.js';

type HubChoice = 'add' | 'update' | 'remove' | 'list' | 'sync' | 'check' | 'quit';
type HubAction = Exclude<HubChoice, 'quit'>;

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

const hubCommandOpts: Record<HubAction, Record<string, unknown>> = {
  add: skipIntro,
  update: skipIntro,
  remove: skipIntro,
  list: skipIntro,
  sync: skipIntro,
  check: { ...skipIntro, offerUpdateOnDrift: true },
};

const SIGN_OFF = 'Bwoah... Happy Coding :)';

/** Session recap printed on quit: what ran, what failed, how to come back, and a sign-off. */
export function renderHubFarewell(completed: HubAction[], failed: HubAction[]): string {
  const ran = [...new Set(completed)];
  const broke = [...new Set(failed)];
  const lines: string[] = [];
  if (ran.length === 0 && broke.length === 0) {
    lines.push('Nothing run this session.');
  } else {
    if (ran.length > 0) lines.push(`${success('Ran')} ${ran.join(', ')}`);
    if (broke.length > 0) lines.push(`Failed ${broke.join(', ')}`);
  }
  lines.push(muted('Run `my-agent-skills` anytime to manage your skills.'));
  lines.push('');
  lines.push(brand(SIGN_OFF));
  return lines.join('\n');
}

async function runHubAction(choice: HubAction): Promise<void> {
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
  const completed: HubAction[] = [];
  const failed: HubAction[] = [];

  const removeGuard = installCtrlCGuard();
  try {
    for (;;) {
      if (showIntro) {
        showTTYIntro();
        showIntro = false;
      }

      const choice = await pickHubAction();

      if (choice === 'cancel' || choice === 'quit') {
        outro(renderHubFarewell(completed, failed));
        if (failed.length > 0) {
          // The recap already names what failed; just exit non-zero.
          process.exitCode = 1;
        }
        return;
      }

      try {
        await runHubAction(choice);
        completed.push(choice);
      } catch (err) {
        if (err instanceof CliCancel) {
          // Esc inside an action: abandon it and return to the menu.
          continue;
        }
        if (err instanceof CliError) {
          failed.push(choice);
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
