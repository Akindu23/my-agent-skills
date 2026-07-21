import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  isCancel: vi.fn(),
  cancel: vi.fn(),
  note: vi.fn(),
  outro: vi.fn(),
  runScopedCommand: vi.fn(),
  createDriftPlan: vi.fn(),
  buildDriftReport: vi.fn(),
  renderDriftSummary: vi.fn(),
  runUpdate: vi.fn(),
}));

vi.mock('@clack/prompts', () => ({
  confirm: mocks.confirm,
  isCancel: mocks.isCancel,
  cancel: mocks.cancel,
  note: mocks.note,
  outro: mocks.outro,
}));

vi.mock('../../src/lib/run-scoped-command.js', () => ({
  runScopedCommand: mocks.runScopedCommand,
}));

vi.mock('../../src/lib/drift-plan.js', () => ({
  createDriftPlan: mocks.createDriftPlan,
  buildDriftReport: mocks.buildDriftReport,
  assessTargetHealth: vi.fn(async () => ({})),
}));

vi.mock('../../src/lib/drift-summary.js', () => ({
  renderDriftSummary: mocks.renderDriftSummary,
}));

vi.mock('../../src/commands/update.js', () => ({
  runUpdate: mocks.runUpdate,
}));

const { runCheck } = await import('../../src/commands/check.js');

describe('runCheck update offer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirm.mockResolvedValue(true);
    mocks.isCancel.mockReturnValue(false);
    mocks.renderDriftSummary.mockReturnValue('summary');
    mocks.runScopedCommand.mockResolvedValue({
      isInteractive: true,
      scope: {
        scope: 'project',
        cwd: '/repo',
        agentsDir: '/repo/.agents',
        skillsDir: '/repo/.agents/skills',
        lockPath: '/repo/.agents/cursor-skills-lock.json',
      },
    });
    mocks.createDriftPlan.mockResolvedValue({ entries: [] });
    mocks.buildDriftReport.mockReturnValue({
      hasDrift: true,
      hasContentDrift: true,
      hasUnhealthyTargets: false,
      jsonPayload: { targets: {} },
    });
    mocks.runUpdate.mockResolvedValue(undefined);
  });

  it('delegates accepted hub update offers to runUpdate with resolved scope', async () => {
    await runCheck({
      project: true,
      source: '/pack',
      offerUpdateOnDrift: true,
      skipIntro: true,
    });

    expect(mocks.confirm).toHaveBeenCalledWith({
      message: 'Run update now?',
      initialValue: true,
    });
    expect(mocks.runUpdate).toHaveBeenCalledWith({
      project: true,
      global: false,
      source: '/pack',
      cwd: '/repo',
      skipIntro: true,
      skipDriftSummary: true,
    });
    expect(mocks.outro).not.toHaveBeenCalledWith('Update complete.');
  });
});
