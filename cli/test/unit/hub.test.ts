import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CliCancel, CliError } from '../../src/lib/errors.js';

const mocks = vi.hoisted(() => {
  const runAddMock = vi.fn();
  const runUpdateMock = vi.fn();
  const runRemoveMock = vi.fn();
  const runListMock = vi.fn();
  const runSyncMock = vi.fn();
  const runCheckMock = vi.fn();

  const runCommandMock = vi.fn((id: string, opts: unknown) => {
    const handlers: Record<string, (o: unknown) => Promise<void>> = {
      add: runAddMock,
      update: runUpdateMock,
      remove: runRemoveMock,
      list: runListMock,
      sync: runSyncMock,
      check: runCheckMock,
    };
    const handler = handlers[id];
    if (!handler) {
      throw new Error(`runCommand mock: unknown id ${JSON.stringify(id)}`);
    }
    return handler(opts);
  });

  return {
    selectMock: vi.fn(),
    textMock: vi.fn(),
    runAddMock,
    runUpdateMock,
    runRemoveMock,
    runListMock,
    runSyncMock,
    runCheckMock,
    runCommandMock,
  };
});

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  select: (...args: unknown[]) => mocks.selectMock(...args),
  text: (...args: unknown[]) => mocks.textMock(...args),
  isCancel: vi.fn((value: unknown) => value === Symbol.for('cancel')),
  cancel: vi.fn(),
}));

vi.mock('../../src/lib/banner.js', () => ({
  showTTYIntro: vi.fn(),
  renderBanner: vi.fn(() => 'banner'),
}));

vi.mock('../../src/lib/keypress-guard.js', () => ({
  installCtrlCGuard: vi.fn(() => vi.fn()),
}));

vi.mock('../../src/lib/run-command.js', () => ({
  runCommand: mocks.runCommandMock,
}));

const { isCancel, outro } = await import('@clack/prompts');
const { showTTYIntro } = await import('../../src/lib/banner.js');
const { installCtrlCGuard } = await import('../../src/lib/keypress-guard.js');
const { runHub, renderHubFarewell } = await import('../../src/commands/hub.js');
const { stripAnsi } = await import('../../src/lib/theme.js');

function outroText(): string {
  return stripAnsi(String(vi.mocked(outro).mock.calls.at(-1)?.[0]));
}

/** Drive the menu from a scripted list of choices, defaulting to quit. */
function scriptMenu(choices: HubChoiceLike[]): void {
  const queue = [...choices];
  mocks.selectMock.mockImplementation(async () => queue.shift() ?? 'quit');
}

type HubChoiceLike = string | symbol;

describe('runHub', () => {
  beforeEach(() => {
    mocks.selectMock.mockReset();
    mocks.textMock.mockReset();
    mocks.runAddMock.mockReset();
    mocks.runUpdateMock.mockReset();
    mocks.runRemoveMock.mockReset();
    mocks.runListMock.mockReset();
    mocks.runSyncMock.mockReset();
    mocks.runCheckMock.mockReset();
    vi.mocked(isCancel).mockImplementation((value) => value === Symbol.for('cancel'));
    mocks.textMock.mockResolvedValue('');
    mocks.runAddMock.mockResolvedValue(undefined);
    mocks.runCheckMock.mockResolvedValue(undefined);
    mocks.runListMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.exitCode = undefined;
    vi.clearAllMocks();
  });

  it('shows intro once and installs the guard for the session', async () => {
    scriptMenu(['add']);

    await runHub();

    expect(showTTYIntro).toHaveBeenCalledTimes(1);
    expect(installCtrlCGuard).toHaveBeenCalledTimes(1);
  });

  it('loops after an action, then quits cleanly', async () => {
    scriptMenu(['add', 'quit']);

    await runHub();

    expect(mocks.runAddMock).toHaveBeenCalledWith({ skipIntro: true });
    expect(mocks.textMock).toHaveBeenCalledTimes(1); // pause after the action
    expect(mocks.selectMock).toHaveBeenCalledTimes(2);
    expect(outroText()).toContain('Ran add');
  });

  it('passes offerUpdateOnDrift and returns to the menu after check', async () => {
    scriptMenu(['check', 'quit']);

    await runHub();

    expect(mocks.runCheckMock).toHaveBeenCalledWith({
      skipIntro: true,
      offerUpdateOnDrift: true,
    });
    expect(mocks.selectMock).toHaveBeenCalledTimes(2);
    expect(outroText()).toContain('Ran check');
  });

  it('Esc mid-action returns to the menu with no failure and no pause', async () => {
    mocks.runAddMock.mockRejectedValueOnce(new CliCancel());
    scriptMenu(['add', 'quit']);

    await runHub();

    expect(mocks.runAddMock).toHaveBeenCalledTimes(1);
    expect(mocks.textMock).not.toHaveBeenCalled(); // abandoned: nothing to read
    expect(outroText()).toContain('Nothing run this session.'); // clean exit, no throw
  });

  it('Esc at the menu quits cleanly via the shared quit path', async () => {
    scriptMenu([Symbol.for('cancel')]);

    await expect(runHub()).resolves.toBeUndefined();

    expect(outroText()).toContain('Nothing run this session.');
  });

  it('records failure on a CliError and exits non-zero at quit', async () => {
    mocks.runAddMock.mockRejectedValueOnce(new CliError('install failed'));
    scriptMenu(['add', 'list', 'quit']);

    await runHub();

    expect(process.exitCode).toBe(1);
    expect(mocks.runAddMock).toHaveBeenCalledTimes(1);
    expect(mocks.runListMock).toHaveBeenCalledWith({ skipIntro: true });
    expect(outroText()).toContain('Ran list');
    expect(outroText()).toContain('Failed add');
  });

  it('exits non-zero when Esc-at-menu follows a failed action', async () => {
    mocks.runAddMock.mockRejectedValueOnce(new CliError('install failed'));
    scriptMenu(['add', Symbol.for('cancel')]);

    await runHub();

    expect(process.exitCode).toBe(1);
  });

  it('removes the guard on teardown', async () => {
    const remove = vi.fn();
    vi.mocked(installCtrlCGuard).mockReturnValueOnce(remove);
    scriptMenu(['quit']);

    await runHub();

    expect(remove).toHaveBeenCalledTimes(1);
  });
});

describe('renderHubFarewell', () => {
  it('lists each action once, in first-run order, plus the come-back hint', () => {
    expect(stripAnsi(renderHubFarewell(['add', 'check', 'add'], ['update']))).toBe(
      'Ran add, check\nFailed update\nRun `my-agent-skills` anytime to manage your skills.\n\nBwoah... Happy Coding :)',
    );
  });
});
