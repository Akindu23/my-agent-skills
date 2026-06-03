import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolvePlannedInstallAction } from '../../src/lib/install-policy.js';
import type { LockSkillEntry } from '../../src/lib/lockfile.js';

const tmpDirs: string[] = [];

async function tempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'cas-policy-'));
  tmpDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

const entry = (hash: string): LockSkillEntry => ({
  source: 'Akindu23/my-agent-skills',
  sourceType: 'github',
  computedHash: hash,
  linkType: 'symlink',
  installedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('resolvePlannedInstallAction', () => {
  it('skips when on-disk link is healthy and hash matches lock', async () => {
    const root = await tempDir();
    const target = path.join(root, 'bundle', 'alpha');
    const dest = path.join(root, 'dest', 'alpha');
    await mkdir(target, { recursive: true });
    await mkdir(path.dirname(dest), { recursive: true });
    await symlink(target, dest, 'dir');
    await writeFile(path.join(target, 'SKILL.md'), '---\nname: alpha\n---\n');

    const action = await resolvePlannedInstallAction({
      destDir: dest,
      bundleHash: 'abc',
      lockEntry: entry('abc'),
      plannedLinkType: 'symlink',
    });
    expect(action).toBe('skip');
  });

  it('confirms when hash matches but planned copy and on-disk is symlink', async () => {
    const root = await tempDir();
    const target = path.join(root, 'bundle', 'alpha');
    const dest = path.join(root, 'dest', 'alpha');
    await mkdir(target, { recursive: true });
    await mkdir(path.dirname(dest), { recursive: true });
    await symlink(target, dest, 'dir');

    const action = await resolvePlannedInstallAction({
      destDir: dest,
      bundleHash: 'abc',
      lockEntry: { ...entry('abc'), linkType: 'symlink' },
      plannedLinkType: 'copy',
    });
    expect(action).toBe('confirm');
  });

  it('confirms when healthy but hash differs', async () => {
    const root = await tempDir();
    const target = path.join(root, 'bundle', 'alpha');
    const dest = path.join(root, 'dest', 'alpha');
    await mkdir(target, { recursive: true });
    await mkdir(path.dirname(dest), { recursive: true });
    await symlink(target, dest, 'dir');

    const action = await resolvePlannedInstallAction({
      destDir: dest,
      bundleHash: 'new-hash',
      lockEntry: entry('old-hash'),
      plannedLinkType: 'symlink',
    });
    expect(action).toBe('confirm');
  });

  it('returns new when destination is missing and no lock entry', async () => {
    const root = await tempDir();
    const dest = path.join(root, 'dest', 'alpha');
    const action = await resolvePlannedInstallAction({
      destDir: dest,
      bundleHash: 'abc',
      plannedLinkType: 'symlink',
    });
    expect(action).toBe('new');
  });

  it('returns update when destination is missing but lock entry exists', async () => {
    const root = await tempDir();
    const dest = path.join(root, 'dest', 'alpha');
    const action = await resolvePlannedInstallAction({
      destDir: dest,
      bundleHash: 'abc',
      lockEntry: entry('abc'),
      plannedLinkType: 'symlink',
    });
    expect(action).toBe('update');
  });
});
