import { mkdir, mkdtemp, readFile, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { computeSkillFolderHash } from '../../src/lib/hash.js';
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

async function projectWithDriftedAlpha(): Promise<string> {
  const project = await mkdtemp(path.join(os.tmpdir(), 'cas-reinstall-'));
  tempProjects.push(project);
  await mkdir(path.join(project, '.git'), { recursive: true });

  const env = { CURSOR_AGENT_SKILLS_ROOT: bundleMini };
  let result = await runCli(
    ['add', '--skill', 'alpha', '-p', '-y', '--json'],
    { cwd: project, env },
  );
  expect(result.exitCode, result.stderr).toBe(0);

  const alphaSource = path.join(bundleMini, 'alpha');
  const alphaDest = path.join(project, '.agents/skills/alpha');
  const hash = await computeSkillFolderHash(alphaSource);
  const lockPath = path.join(project, '.agents/cursor-skills-lock.json');
  const lock = JSON.parse(await readFile(lockPath, 'utf8'));
  lock.skills.alpha.computedHash = 'stale-hash';
  await rm(lockPath);
  await mkdir(path.dirname(lockPath), { recursive: true });
  const { writeFile } = await import('node:fs/promises');
  await writeFile(lockPath, JSON.stringify(lock));
  await rm(alphaDest, { force: true });
  await mkdir(path.dirname(alphaDest), { recursive: true });
  await symlink(alphaSource, alphaDest, 'dir');

  return project;
}

describe('add reinstall (hash drift)', () => {
  it('non-TTY -y applies drift and second add skips', async () => {
    const project = await projectWithDriftedAlpha();
    const env = { CURSOR_AGENT_SKILLS_ROOT: bundleMini };

    let result = await runCli(
      ['add', '--skill', 'alpha', '-p', '-y', '--json'],
      { cwd: project, env, nonTty: true },
    );
    expect(result.exitCode, result.stderr).toBe(0);

    const payload = JSON.parse(result.stdout);
    expect(payload.reinstalled).toEqual(['alpha']);
    expect(payload.installed).toEqual([]);

    const lock = JSON.parse(
      await readFile(path.join(project, '.agents/cursor-skills-lock.json'), 'utf8'),
    );
    const bundleHash = await computeSkillFolderHash(path.join(bundleMini, 'alpha'));
    expect(lock.skills.alpha.computedHash).toBe(bundleHash);

    result = await runCli(
      ['add', '--skill', 'alpha', '-p', '-y', '--json'],
      { cwd: project, env, nonTty: true },
    );
    expect(result.exitCode, result.stderr).toBe(0);
    const second = JSON.parse(result.stdout);
    expect(second.skipped).toEqual(['alpha']);
    expect(second.reinstalled).toEqual([]);
  });
});
