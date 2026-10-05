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
  promptNewSkillInstall: vi.fn(),
  planInstalls: vi.fn(),
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

vi.mock('../../src/lib/apply-drift-plan.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/lib/apply-drift-plan.js')>()),
  applyDriftPlan: mocks.applyDriftPlan,
  planInstalls: mocks.planInstalls,
  planHasWork: mocks.planHasWork,
  formatUpdateConfirmMessage: mocks.formatUpdateConfirmMessage,
}));

vi.mock('../../src/lib/prompts.js', () => ({
  confirmProceed: mocks.confirmProceed,
  promptOrphanRemoval: mocks.promptOrphanRemoval,
  promptDependencyInstall: mocks.promptDependencyInstall,
  promptNewSkillInstall: mocks.promptNewSkillInstall,
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
      newSkillsAdded: [],
      newSkillsSkipped: [],
      requiredBy: {},
    });
    mocks.planHasWork.mockReturnValue(true);
    mocks.planInstalls.mockResolvedValue({ items: [], unmanaged: [] });
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

describe('runUpdate new pack skills', () => {
  const scope = {
    scope: 'project',
    cwd: '/repo',
    agentsDir: '/repo/.agents',
    skillsDir: '/repo/.agents/skills',
    lockPath: '/repo/.agents/cursor-skills-lock.json',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.runScopedCommand.mockResolvedValue({ isInteractive: true, scope });
    mocks.createDriftPlan.mockResolvedValue({
      entries: [
        { name: 'alpha', status: 'ok' },
        { name: 'gamma', status: 'newSkill' },
      ],
      lock: { targets: ['cursor'] },
      commitDrift: true,
      manifestDrift: false,
    });
    mocks.confirmProceed.mockResolvedValue(true);
    mocks.formatUpdateConfirmMessage.mockReturnValue('Proceed with update?');
    mocks.planInstalls.mockResolvedValue({
      items: [
        { name: 'beta', role: 'dependency', requiredBy: 'gamma' },
        { name: 'gamma', role: 'root' },
      ],
      unmanaged: [],
    });
    mocks.applyDriftPlan.mockResolvedValue({
      updated: ['alpha'],
      contentChanged: [],
      orphansRemoved: [],
      orphansSkipped: [],
      dependenciesAdded: ['beta'],
      dependenciesSkipped: [],
      newSkillsAdded: ['gamma'],
      newSkillsSkipped: [],
      requiredBy: { beta: 'gamma' },
    });
    mocks.planHasWork.mockReturnValue(true);
  });

  it('prompts for new skills and discloses their dependencies before confirm', async () => {
    mocks.promptNewSkillInstall.mockResolvedValue(['gamma']);

    await runUpdate({ project: true });

    expect(mocks.promptNewSkillInstall).toHaveBeenCalledWith(['gamma']);
    const disclosure = mocks.note.mock.calls.find(([, title]) => title === 'New skills');
    expect(disclosure?.[0]).toContain('+ beta (required by gamma)');
    const [, chosen] = mocks.planInstalls.mock.calls[0]!;
    expect([...chosen.newSkillsToInstall]).toEqual(['gamma']);
    const [, opts] = mocks.applyDriftPlan.mock.calls[0]!;
    expect(opts.installs.map((i: { name: string }) => i.name)).toEqual(['beta', 'gamma']);
  });

  it('-y installs all new skills and logs each dependency with its reason', async () => {
    mocks.runScopedCommand.mockResolvedValue({ isInteractive: false, scope });
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runUpdate({ project: true, yes: true });

    expect(mocks.promptNewSkillInstall).not.toHaveBeenCalled();
    const [, chosen] = mocks.planInstalls.mock.calls[0]!;
    expect([...chosen.newSkillsToInstall]).toEqual(['gamma']);
    const lines = log.mock.calls.map(([line]) => line);
    expect(lines).toContain('Added gamma (new skill)');
    expect(lines).toContain('Added beta (required by gamma)');
    log.mockRestore();
  });

  it('non-interactive without -y warns and skips new skills', async () => {
    mocks.runScopedCommand.mockResolvedValue({ isInteractive: false, scope });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await runUpdate({ project: true });

    expect(warn.mock.calls.map(([line]) => line).join('\n')).toContain('Skipping new skill "gamma"');
    const [, chosen] = mocks.planInstalls.mock.calls[0]!;
    expect([...chosen.newSkillsToInstall]).toEqual([]);
    vi.restoreAllMocks();
  });
});
