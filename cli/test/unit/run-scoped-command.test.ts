import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const showTTYIntroMock = vi.fn();
const resolveScopeInteractiveMock = vi.fn(async () => ({
  scope: 'project' as const,
  cwd: '/proj',
  agentsDir: '/proj/.agents',
  skillsDir: '/proj/.agents/skills',
  lockPath: '/proj/.agents/cursor-skills.lock',
}));

vi.mock('../../src/lib/banner.js', () => ({
  showTTYIntro: (...args: unknown[]) => showTTYIntroMock(...args),
}));

vi.mock('../../src/lib/scope.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/scope.js')>();
  return {
    ...actual,
    resolveScopeInteractive: (...args: unknown[]) => resolveScopeInteractiveMock(...args),
  };
});

const { runScopedCommand } = await import('../../src/lib/run-scoped-command.js');

const stdinTty = process.stdin.isTTY;
const stdoutTty = process.stdout.isTTY;

function setTty(value: boolean): void {
  Object.defineProperty(process.stdin, 'isTTY', { value, configurable: true });
  Object.defineProperty(process.stdout, 'isTTY', { value, configurable: true });
}

beforeEach(() => {
  showTTYIntroMock.mockClear();
  resolveScopeInteractiveMock.mockClear();
  setTty(true);
});

afterEach(() => {
  Object.defineProperty(process.stdin, 'isTTY', { value: stdinTty, configurable: true });
  Object.defineProperty(process.stdout, 'isTTY', { value: stdoutTty, configurable: true });
});

describe('runScopedCommand', () => {
  it('shows intro unless skipIntro', async () => {
    await runScopedCommand({ project: true });
    expect(showTTYIntroMock).toHaveBeenCalledWith({ skip: undefined });

    showTTYIntroMock.mockClear();
    await runScopedCommand({ project: true, skipIntro: true });
    expect(showTTYIntroMock).toHaveBeenCalledWith({ skip: true });
  });

  it('forwards scope flags including yes and cwd', async () => {
    await runScopedCommand({
      project: true,
      yes: true,
      cwd: '/custom',
    });

    expect(resolveScopeInteractiveMock).toHaveBeenCalledWith(
      { global: undefined, project: true, yes: true, cwd: '/custom' },
      true,
    );
  });

  it('treats json mode as non-interactive for scope resolution', async () => {
    setTty(true);
    const ctx = await runScopedCommand({ project: true, json: true });

    expect(ctx.isJson).toBe(true);
    expect(ctx.isInteractive).toBe(false);
    expect(showTTYIntroMock).not.toHaveBeenCalled();
    expect(resolveScopeInteractiveMock).toHaveBeenCalledWith(
      expect.objectContaining({ project: true }),
      false,
    );
  });

  it('runs afterIntro with context before returning', async () => {
    const afterIntro = vi.fn();
    const ctx = await runScopedCommand({ project: true, skipIntro: true, afterIntro });

    expect(afterIntro).toHaveBeenCalledWith(ctx);
    expect(ctx.scope.scope).toBe('project');
  });
});
