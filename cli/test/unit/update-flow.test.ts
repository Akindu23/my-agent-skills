import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  calls: [] as string[],
  note: vi.fn(),
  outro: vi.fn(),
  runScopedCommand: vi.fn(),
  createDriftPlan: vi.fn(),
  applyDriftPlan: vi.fn(),
  planHasWork: vi.fn(),
  formatUpdateConfirmMessage: vi.fn(),
  confirmProceed: vi.fn(),
  promptOrphanRemoval: vi.fn(),
  promptDependencyInstall: vi.fn(),
}));

vi.mock('@clack/prompts', () => ({
  note: mocks.note,
  outro: mocks.outro,
}));

vi.mock('../../src/lib/run-scoped-command.js', () => ({
  runScopedCommand: mocks.runScopedCommand,
}));

vi.mock('../../src/lib/drift-plan.js', () => ({
  createDriftPlan: mocks.createDriftPlan,
}));

vi.mock('../../src/lib/drift-summary.js', () => ({
  renderDriftSummary: vi.fn(() => 'summary'),
}));

vi.mock('../../src/lib/apply-drift-plan.js', () => ({
  applyDriftPlan: mocks.applyDriftPlan,
  planHasWork: mocks.planHasWork,
  formatUpdateConfirmMessage: mocks.formatUpdateConfirmMessage,
}));

vi.mock('../../src/lib/prompts.js', () => ({
  confirmProceed: mocks.confirmProceed,
  promptOrphanRemoval: mocks.promptOrphanRemoval,
  promptDependencyInstall: mocks.promptDependencyInstall,
}));

const { runUpdate } = await import('../../src/commands/update.js');

describe('runUpdate orphan flow', () => {
  beforeEach(() => {
    mocks.calls.length = 0;
    vi.clearAllMocks();
    mocks.note.mockImplementation(() => {
      mocks.calls.push('note');
    });
    mocks.outro.mockImplementation(() => {
      mocks.calls.push('outro');
    });
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
    mocks.createDriftPlan.mockResolvedValue({
      entries: [
        { name: 'alpha', status: 'hashDrift' },
        { name: 'ghost', status: 'orphan' },
      ],
      commitDrift: false,
      manifestDrift: false,
    });
    mocks.promptOrphanRemoval.mockImplementation(async () => {
      mocks.calls.push('multiselect');
      return ['ghost'];
    });
    mocks.confirmProceed.mockImplementation(async () => {
      mocks.calls.push('confirm');
      return true;
    });
    mocks.formatUpdateConfirmMessage.mockReturnValue('Proceed with update?');
    mocks.applyDriftPlan.mockResolvedValue({
      updated: ['alpha'],
      contentChanged: ['alpha'],
      orphansRemoved: ['ghost'],
      orphansSkipped: [],
      dependenciesAdded: [],
      dependenciesSkipped: [],
    });
    mocks.planHasWork.mockReturnValue(true);
  });

  it('asks orphan selection before final proceed confirmation', async () => {
    await runUpdate({ project: true });

    expect(mocks.calls.slice(0, 3)).toEqual(['note', 'multiselect', 'confirm']);
    expect(mocks.applyDriftPlan).toHaveBeenCalled();
  });

  it('does not apply when final confirmation is declined', async () => {
    mocks.confirmProceed.mockImplementationOnce(async () => {
      mocks.calls.push('confirm');
      return false;
    });

    await runUpdate({ project: true });

    expect(mocks.calls.slice(0, 3)).toEqual(['note', 'multiselect', 'confirm']);
    expect(mocks.applyDriftPlan).not.toHaveBeenCalled();
  });

  it('-y removes all orphans without prompting for orphan selection', async () => {
    await runUpdate({ project: true, yes: true });

    expect(mocks.promptOrphanRemoval).not.toHaveBeenCalled();
    const [, opts] = mocks.applyDriftPlan.mock.calls[0]!;
    expect([...opts.orphansToRemove]).toEqual(['ghost']);
  });
});
