import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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
  const dir = await mkdtemp(path.join(os.tmpdir(), 'cas-upd-'));
  tempProjects.push(dir);
  await mkdir(path.join(dir, '.git'), { recursive: true });
  return dir;
}

describe('update and check integration', () => {
  it('check exits 1 on drift; update refreshes; check exits 0', async () => {
    const project = await emptyProject();
    const env = { CURSOR_AGENT_SKILLS_ROOT: bundleMini };
    const lockPath = path.join(project, '.agents/cursor-skills-lock.json');

    let result = await runCli(
      ['add', '--skill', 'alpha', '-p', '-y', '--json'],
      { cwd: project, env },
    );
    expect(result.exitCode, result.stderr).toBe(0);

    const lock = JSON.parse(await readFile(lockPath, 'utf8'));
    lock.skills.alpha.computedHash = 'stale-hash';
    await writeFile(lockPath, JSON.stringify(lock, null, 2));

    result = await runCli(['check', '-p', '--json'], { cwd: project, env });
    expect(result.exitCode, result.stderr).toBe(1);
    const checkPayload = JSON.parse(result.stdout);
    expect(checkPayload.inSync).toBe(false);
    expect(checkPayload.skills.some((s: { status: string }) => s.status === 'hashDrift')).toBe(
      true,
    );

    result = await runCli(['update', '-p', '-y', '--json'], { cwd: project, env });
    expect(result.exitCode, result.stderr).toBe(0);
    const updatePayload = JSON.parse(result.stdout);
    expect(updatePayload.updated).toContain('alpha');

    result = await runCli(['check', '-p'], { cwd: project, env });
    expect(result.exitCode, result.stderr).toBe(0);
  });

  it('reports orphan on check; update -y removes it', async () => {
    const project = await emptyProject();
    const env = { CURSOR_AGENT_SKILLS_ROOT: bundleMini };
    const lockPath = path.join(project, '.agents/cursor-skills-lock.json');

    await runCli(['add', '--skill', 'alpha', '-p', '-y'], { cwd: project, env });

    const lock = JSON.parse(await readFile(lockPath, 'utf8'));
    lock.skills.ghost = {
      source: 'Akindu23/my-agent-skills',
      sourceType: 'github',
      computedHash: 'deadbeef',
      linkType: 'symlink',
      installedAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    await writeFile(lockPath, JSON.stringify(lock, null, 2));

    let result = await runCli(['check', '-p', '--json'], { cwd: project, env });
    expect(result.exitCode).toBe(1);
    expect(
      JSON.parse(result.stdout).skills.some((s: { status: string }) => s.status === 'orphan'),
    ).toBe(true);

    result = await runCli(['update', '-p', '-y', '--json'], { cwd: project, env });
    expect(result.exitCode, result.stderr).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.orphansRemoved).toEqual(['ghost']);
    expect(payload.orphansSkipped).toEqual([]);

    const afterLock = JSON.parse(await readFile(lockPath, 'utf8'));
    expect(afterLock.skills.ghost).toBeUndefined();
    expect(result.stderr).not.toContain('ghost');
  });

  it('non-TTY update without -y skips orphan with warning', async () => {
    const project = await emptyProject();
    const env = { CURSOR_AGENT_SKILLS_ROOT: bundleMini };
    const lockPath = path.join(project, '.agents/cursor-skills-lock.json');

    await runCli(['add', '--skill', 'alpha', '-p', '-y'], { cwd: project, env });

    const lock = JSON.parse(await readFile(lockPath, 'utf8'));
    lock.skills.ghost = {
      source: 'Akindu23/my-agent-skills',
      sourceType: 'github',
      computedHash: 'deadbeef',
      linkType: 'symlink',
      installedAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    await writeFile(lockPath, JSON.stringify(lock, null, 2));

    const result = await runCli(['update', '-p', '--json'], {
      cwd: project,
      env,
      nonTty: true,
    });
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.orphansRemoved).toEqual([]);
    expect(payload.orphansSkipped).toEqual(['ghost']);

    const afterLock = JSON.parse(await readFile(lockPath, 'utf8'));
    expect(afterLock.skills.ghost).toBeDefined();
    expect(result.stderr).toContain('Skipping orphan skill "ghost"');
  });

  it('check without scope errors', async () => {
    const project = await emptyProject();
    const result = await runCli(['check', '--json'], { cwd: project });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/scope/i);
  });
});
