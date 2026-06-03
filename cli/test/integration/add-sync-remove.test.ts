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
    expect(result.stdout).toContain('Usage: cursor-agent-skills');
  });

  it('bare invoke without subcommand exits 1 in non-TTY', async () => {
    const result = await runCli([], { nonTty: true });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Subcommand required');
    expect(result.stderr).toContain('cursor-agent-skills add');
  });
});
