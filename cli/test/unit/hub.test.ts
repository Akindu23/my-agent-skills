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
  isCancel: vi.fn((value: unknown) => value === Symbol.for('cancel')),
  cancel: vi.fn(),
}));

vi.mock('../../src/lib/banner.js', () => ({
  showTTYIntro: vi.fn(),
  renderBanner: vi.fn(() => 'banner'),
}));

vi.mock('../../src/lib/run-command.js', () => ({
  runCommand: mocks.runCommandMock,
}));

const { isCancel, cancel, outro } = await import('@clack/prompts');
const { showTTYIntro } = await import('../../src/lib/banner.js');
const { runHub } = await import('../../src/commands/hub.js');

describe('runHub', () => {
  beforeEach(() => {
    mocks.selectMock.mockReset();
    mocks.runAddMock.mockReset();
    mocks.runUpdateMock.mockReset();
    mocks.runRemoveMock.mockReset();
    mocks.runListMock.mockReset();
    mocks.runSyncMock.mockReset();
    mocks.runCheckMock.mockReset();
    vi.mocked(isCancel).mockImplementation((value) => value === Symbol.for('cancel'));
    mocks.runAddMock.mockResolvedValue(undefined);
    mocks.runCheckMock.mockResolvedValue(undefined);
    mocks.runListMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows intro once, dispatches add with skipIntro, then returns (no menu loop)', async () => {
    mocks.selectMock.mockResolvedValueOnce('add');

    await runHub();

    expect(showTTYIntro).toHaveBeenCalledTimes(1);
    expect(mocks.runAddMock).toHaveBeenCalledWith({ skipIntro: true });
    expect(mocks.selectMock).toHaveBeenCalledTimes(1);
    expect(outro).not.toHaveBeenCalled();
  });

  it('passes offerUpdateOnDrift when check is selected', async () => {
    mocks.selectMock.mockResolvedValueOnce('check');

    await runHub();

    expect(mocks.runCheckMock).toHaveBeenCalledWith({
      skipIntro: true,
      offerUpdateOnDrift: true,
    });
  });

  it('--menu mode loops until quit', async () => {
    mocks.selectMock.mockResolvedValueOnce('add').mockResolvedValueOnce('quit');

    await runHub({ menu: true });

    expect(mocks.runAddMock).toHaveBeenCalledTimes(1);
    expect(mocks.selectMock).toHaveBeenCalledTimes(2);
    expect(outro).toHaveBeenCalledWith('Goodbye.');
  });

  it('rethrows CliError when not in menu mode', async () => {
    mocks.runAddMock.mockRejectedValueOnce(new CliError('install failed'));
    mocks.selectMock.mockResolvedValueOnce('add');

    await expect(runHub()).rejects.toThrow('install failed');
    expect(mocks.runAddMock).toHaveBeenCalledTimes(1);
    expect(mocks.selectMock).toHaveBeenCalledTimes(1);
  });

  it('continues after CliError in menu mode', async () => {
    mocks.runAddMock.mockRejectedValueOnce(new CliError('install failed'));
    const menuChoices = ['add', 'list'];
    mocks.selectMock.mockImplementation(async () => menuChoices.shift() ?? 'quit');

    await runHub({ menu: true });

    expect(mocks.runAddMock).toHaveBeenCalledTimes(1);
    expect(mocks.runListMock).toHaveBeenCalledWith({ skipIntro: true });
    expect(mocks.selectMock).toHaveBeenCalledTimes(3);
    expect(outro).toHaveBeenCalledWith('Goodbye.');
  });

  it('throws CliCancel on cancel', async () => {
    mocks.selectMock.mockResolvedValue(Symbol.for('cancel'));
    vi.mocked(isCancel).mockReturnValue(true);

    await expect(runHub()).rejects.toThrow(CliCancel);
    expect(cancel).toHaveBeenCalledWith('Cancelled.');
  });
});
