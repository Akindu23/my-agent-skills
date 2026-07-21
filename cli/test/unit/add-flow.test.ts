import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const calls: string[] = [];

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(() => calls.push('intro')),
  note: vi.fn(() => calls.push('note')),
  outro: vi.fn(() => calls.push('outro')),
  multiselect: vi.fn(async () => {
    calls.push('multiselect');
    return ['beta'];
  }),
  select: vi.fn(async (opts) => {
    calls.push('select');
    const message = String((opts as { message?: string }).message ?? '');
    if (message.includes('scope') || message.includes('Select scope')) return 'project';
    if (message.includes('target')) return 'cursor';
    return 'symlink';
  }),
  confirm: vi.fn(async () => {
    calls.push('confirm');
    return true;
  }),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
}));

const { confirm } = await import('@clack/prompts');
const { computeSkillFolderHash } = await import('../../src/lib/hash.js');
const { runAdd } = await import('../../src/commands/add.js');

const cliRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const bundleMini = path.join(cliRoot, 'test/fixtures/bundle-mini/skills');
const tmpDirs: string[] = [];
const originalCwd = process.cwd();
const stdinTty = process.stdin.isTTY;
const stdoutTty = process.stdout.isTTY;

async function tempProject(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'cas-add-flow-'));
  tmpDirs.push(dir);
  await mkdir(path.join(dir, '.git'), { recursive: true });
  return dir;
}

function setTty(value: boolean): void {
  Object.defineProperty(process.stdin, 'isTTY', { value, configurable: true });
  Object.defineProperty(process.stdout, 'isTTY', { value, configurable: true });
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

beforeEach(() => {
  calls.length = 0;
  setTty(true);
  vi.mocked(confirm).mockImplementation(async () => {
    calls.push('confirm');
    return true;
  });
});

afterEach(async () => {
  process.chdir(originalCwd);
  Object.defineProperty(process.stdin, 'isTTY', { value: stdinTty, configurable: true });
  Object.defineProperty(process.stdout, 'isTTY', { value: stdoutTty, configurable: true });
  await Promise.all(tmpDirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
  vi.clearAllMocks();
});

describe('runAdd interactive flow', () => {
  it('prompts skills before scope, then confirms before writing', async () => {
    const project = await tempProject();
    process.chdir(project);

    await runAdd({ source: bundleMini });

    expect(calls).toEqual([
      'intro',
      'select',
      'select',
      'note',
      'multiselect',
      'note',
      'select',
      'note',
      'confirm',
      'note',
      'outro',
    ]);
    expect(await pathExists(path.join(project, '.agents/skills/alpha'))).toBe(true);
    expect(await pathExists(path.join(project, '.agents/skills/beta'))).toBe(true);
  });

  it('does not write when proceed is declined', async () => {
    const project = await tempProject();
    process.chdir(project);
    vi.mocked(confirm).mockImplementation(async () => {
      calls.push('confirm');
      return false;
    });

    await runAdd({ source: bundleMini });

    expect(calls).toContain('confirm');
    expect(await pathExists(path.join(project, '.agents'))).toBe(false);
  });

  it('prompts to overwrite when lock hash drifted on a healthy install', async () => {
    const project = await tempProject();
    process.chdir(project);
    const alphaSource = path.join(bundleMini, 'alpha');
    const agentsSkills = path.join(project, '.agents/skills');
    await mkdir(agentsSkills, { recursive: true });
    await symlink(alphaSource, path.join(agentsSkills, 'alpha'), 'dir');
    await writeFile(path.join(project, '.agents/cursor-skills-lock.json'), JSON.stringify({
      version: 1,
      package: { name: 'bundle-mini', version: '0.0.0' },
      skills: {
        alpha: {
          source: 'bundle-mini',
          sourceType: 'bundled',
          computedHash: 'stale-hash',
          linkType: 'symlink',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    }));

    const confirmMessages: string[] = [];
    vi.mocked(confirm).mockImplementation(async (opts) => {
      confirmMessages.push((opts as { message: string }).message);
      calls.push('confirm');
      return true;
    });

    await runAdd({ source: bundleMini, skill: ['alpha'], project: true, target: 'cursor' });

    expect(confirmMessages[0]).toContain('Overwrite 1 skill(s) with bundle content?');
    const lock = JSON.parse(
      await readFile(path.join(project, '.agents/cursor-skills-lock.json'), 'utf8'),
    );
    const hash = await computeSkillFolderHash(alphaSource);
    expect(lock.skills.alpha.computedHash).toBe(hash);
  });

  it('does not write lock when overwrite is declined on drift', async () => {
    const project = await tempProject();
    process.chdir(project);
    const alphaSource = path.join(bundleMini, 'alpha');
    const agentsSkills = path.join(project, '.agents/skills');
    await mkdir(agentsSkills, { recursive: true });
    await symlink(alphaSource, path.join(agentsSkills, 'alpha'), 'dir');
    const lockPath = path.join(project, '.agents/cursor-skills-lock.json');
    const lockBefore = {
      version: 1,
      package: { name: 'bundle-mini', version: '0.0.0' },
      skills: {
        alpha: {
          source: 'bundle-mini',
          sourceType: 'bundled',
          computedHash: 'stale-hash',
          linkType: 'symlink',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    };
    await writeFile(lockPath, JSON.stringify(lockBefore));

    vi.mocked(confirm).mockImplementation(async () => {
      calls.push('confirm');
      return false;
    });

    await runAdd({ source: bundleMini, skill: ['alpha'], project: true, target: 'cursor' });

    const lockAfter = JSON.parse(await readFile(lockPath, 'utf8'));
    expect(lockAfter.skills.alpha.computedHash).toBe('stale-hash');
  });

  it('-y skips only the final proceed prompt in a TTY', async () => {
    const project = await tempProject();
    process.chdir(project);

    await runAdd({ source: bundleMini, yes: true, target: 'cursor' });

    expect(calls).toContain('multiselect');
    expect(calls).toContain('select');
    expect(calls).not.toContain('confirm');
    expect(await pathExists(path.join(project, '.agents/skills/beta'))).toBe(true);
  });
});
