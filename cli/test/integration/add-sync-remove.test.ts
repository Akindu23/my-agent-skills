import { lstat, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { runCli, cliRoot } from '../helpers/run-cli.js';

const bundleMini = path.join(cliRoot, 'test/fixtures/bundle-mini/skills');
const tempProjects: string[] = [];

beforeAll(async () => {
  const { access } = await import('node:fs/promises');
  await access(path.join(cliRoot, 'dist/cli.js'));
});

afterEach(async () => {
  for (const d of tempProjects) {
    await rm(d, { recursive: true, force: true });
  }
  tempProjects.length = 0;
});

async function emptyProject(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'cas-proj-'));
  tempProjects.push(dir);
  await mkdir(path.join(dir, '.git'), { recursive: true });
  return dir;
}

describe('integration', () => {
  it('add installs symlink and lock; sync repairs; remove cleans up', async () => {
    const project = await emptyProject();
    const env = { CURSOR_AGENT_SKILLS_ROOT: bundleMini };

    let result = await runCli(
      ['add', '--skill', 'beta', '-p', '-y', '--json'],
      { cwd: project, env },
    );
    expect(result.exitCode, result.stderr).toBe(0);

    const payload = JSON.parse(result.stdout);
    expect(payload.installed).toContain('alpha');
    expect(payload.installed).toContain('beta');

    const dest = path.join(project, '.agents/skills/beta');
    const st = await lstat(dest);
    expect(st.isSymbolicLink()).toBe(true);

    const lockRaw = await readFile(path.join(project, '.agents/cursor-skills-lock.json'), 'utf8');
    const lock = JSON.parse(lockRaw);
    expect(lock.skills.beta.linkType).toBe('symlink');

    await rm(dest, { force: true });
    result = await runCli(['sync', '-p', '--json'], { cwd: project, env });
    expect(result.exitCode, result.stderr).toBe(0);
    const syncPayload = JSON.parse(result.stdout);
    expect(syncPayload.synced).toContain('beta');
    expect(syncPayload.ok).toContain('alpha');

    result = await runCli(
      ['remove', '--skill', 'beta', '--skill', 'alpha', '-p', '-y', '--json'],
      { cwd: project, env },
    );
    expect(result.exitCode, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout).removed).toEqual(['beta', 'alpha']);
  });

  it('list --json reports lock entries', async () => {
    const project = await emptyProject();
    const env = { CURSOR_AGENT_SKILLS_ROOT: bundleMini };

    await runCli(['add', '--skill', 'alpha', '-p', '-y'], { cwd: project, env });
    const result = await runCli(['list', '-p', '--json'], { cwd: project });
    expect(result.exitCode).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.skills.some((s: { name: string }) => s.name === 'alpha')).toBe(true);
  });

  it('bare command routes to add with flags', async () => {
    const project = await emptyProject();
    const env = { CURSOR_AGENT_SKILLS_ROOT: bundleMini };

    const result = await runCli(
      ['--skill', 'beta', '-p', '-y', '--json'],
      { cwd: project, env },
    );

    expect(result.exitCode, result.stderr).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.scope).toBe('project');
    expect(payload.installed).toEqual(['alpha', 'beta']);
  });

  it('bare help remains the Commander help command', async () => {
    const result = await runCli(['help']);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.stdout).toContain('Usage: my-agent-skills');
  });

  it('bare invoke without subcommand exits 1 in non-TTY', async () => {
    const result = await runCli([], { nonTty: true });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Subcommand required');
    expect(result.stderr).toContain('my-agent-skills add');
  });

  it('add --target both materializes Cursor and Claude trees and records targets', async () => {
    const project = await emptyProject();
    const env = { CURSOR_AGENT_SKILLS_ROOT: bundleMini };

    let result = await runCli(
      ['add', '--skill', 'alpha', '-p', '--target', 'both', '-y', '--json'],
      { cwd: project, env },
    );
    expect(result.exitCode, result.stderr).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.targets).toEqual(['claude', 'cursor']);

    expect((await lstat(path.join(project, '.agents/skills/alpha'))).isSymbolicLink()).toBe(true);
    expect((await lstat(path.join(project, '.claude/skills/alpha'))).isSymbolicLink()).toBe(true);

    const lock = JSON.parse(
      await readFile(path.join(project, '.agents/cursor-skills-lock.json'), 'utf8'),
    );
    expect(lock.targets).toEqual(['claude', 'cursor']);

    await rm(path.join(project, '.claude/skills/alpha'), { force: true });
    result = await runCli(['sync', '-p', '--json'], { cwd: project, env });
    expect(result.exitCode, result.stderr).toBe(0);
    expect((await lstat(path.join(project, '.claude/skills/alpha'))).isSymbolicLink()).toBe(true);

    result = await runCli(['check', '-p', '--json'], { cwd: project, env });
    expect(result.exitCode, result.stderr).toBe(0);
    const checkPayload = JSON.parse(result.stdout);
    expect(checkPayload.targets.cursor.healthy).toBe(true);
    expect(checkPayload.targets.claude.healthy).toBe(true);

    result = await runCli(
      ['remove', '--skill', 'alpha', '-p', '--target', 'claude', '-y', '--json'],
      { cwd: project, env },
    );
    expect(result.exitCode, result.stderr).toBe(0);
    const removePayload = JSON.parse(result.stdout);
    expect(removePayload.narrowed).toContain('alpha');
    expect(removePayload.targets).toEqual(['cursor']);
    expect(await lstat(path.join(project, '.agents/skills/alpha')).then(() => true).catch(() => false)).toBe(true);

    const lockAfter = JSON.parse(
      await readFile(path.join(project, '.agents/cursor-skills-lock.json'), 'utf8'),
    );
    expect(lockAfter.targets).toBeUndefined();
    expect(lockAfter.skills.alpha).toBeDefined();
  });

  it('add --target claude creates lock without Cursor skills tree', async () => {
    const project = await emptyProject();
    const env = { CURSOR_AGENT_SKILLS_ROOT: bundleMini };

    const result = await runCli(
      ['add', '--skill', 'alpha', '-p', '--target', 'claude', '-y', '--json'],
      { cwd: project, env },
    );
    expect(result.exitCode, result.stderr).toBe(0);

    expect((await lstat(path.join(project, '.claude/skills/alpha'))).isSymbolicLink()).toBe(true);
    const cursorSkills = path.join(project, '.agents/skills');
    await expect(lstat(cursorSkills)).rejects.toMatchObject({ code: 'ENOENT' });

    const lock = JSON.parse(
      await readFile(path.join(project, '.agents/cursor-skills-lock.json'), 'utf8'),
    );
    expect(lock.targets).toEqual(['claude']);
  });

  it('add --target unions with existing lock targets; remove keeps target when other skills remain', async () => {
    const project = await emptyProject();
    const env = { CURSOR_AGENT_SKILLS_ROOT: bundleMini };

    let result = await runCli(
      ['add', '--skill', 'alpha', '-p', '--target', 'both', '-y', '--json'],
      { cwd: project, env },
    );
    expect(result.exitCode, result.stderr).toBe(0);

    result = await runCli(
      ['add', '--skill', 'beta', '-p', '--target', 'claude', '-y', '--json'],
      { cwd: project, env },
    );
    expect(result.exitCode, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout).targets).toEqual(['claude']);

    let lock = JSON.parse(
      await readFile(path.join(project, '.agents/cursor-skills-lock.json'), 'utf8'),
    );
    expect(lock.targets).toEqual(['claude', 'cursor']);
    expect((await lstat(path.join(project, '.agents/skills/alpha'))).isSymbolicLink()).toBe(true);

    result = await runCli(['list', '-p', '--json'], { cwd: project, env });
    expect(result.exitCode, result.stderr).toBe(0);
    const listPayload = JSON.parse(result.stdout);
    expect(listPayload.installTargets).toEqual(['claude', 'cursor']);
    expect(listPayload.skills.find((s: { name: string }) => s.name === 'alpha')?.targets.claude).toBeDefined();

    result = await runCli(
      ['remove', '--skill', 'alpha', '-p', '--target', 'claude', '-y', '--json'],
      { cwd: project, env },
    );
    expect(result.exitCode, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout).targets).toEqual(['claude', 'cursor']);

    lock = JSON.parse(
      await readFile(path.join(project, '.agents/cursor-skills-lock.json'), 'utf8'),
    );
    expect(lock.targets).toEqual(['claude', 'cursor']);
    expect((await lstat(path.join(project, '.claude/skills/beta'))).isSymbolicLink()).toBe(true);

    result = await runCli(['sync', '-p', '-y', '--json'], { cwd: project, env });
    expect(result.exitCode, result.stderr).toBe(0);
  });
});
