import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CliError } from '../../src/lib/errors.js';
import {
  emptyLockfile,
  LOCK_VERSION,
  readLockfile,
  upsertSkill,
  writeLockfile,
} from '../../src/lib/lockfile.js';

const dirs: string[] = [];

afterEach(async () => {
  const { rm } = await import('node:fs/promises');
  for (const d of dirs) await rm(d, { recursive: true, force: true });
  dirs.length = 0;
});

describe('lockfile', () => {
  it('round-trips with sorted skill keys', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'lock-'));
    dirs.push(dir);
    const lockPath = path.join(dir, 'cursor-skills.lock');

    let lock = emptyLockfile({ name: 'cursor-agent-skills', version: '0.1.0' });
    upsertSkill(lock, 'zebra', {
      source: 'my-agent-skills',
      sourceType: 'bundled',
      computedHash: 'a'.repeat(64),
      linkType: 'symlink',
    });
    upsertSkill(lock, 'alpha', {
      source: 'my-agent-skills',
      sourceType: 'bundled',
      computedHash: 'b'.repeat(64),
      linkType: 'symlink',
    });

    await writeLockfile(lockPath, lock);
    const raw = await readFile(lockPath, 'utf8');
    const keys = [...raw.matchAll(/^    "([^"]+)": \{/gm)].map((m) => m[1]);
    expect(keys).toEqual(['alpha', 'zebra']);

    const loaded = await readLockfile(lockPath);
    expect(loaded?.skills.alpha?.computedHash).toBe('b'.repeat(64));
  });

  it('rejects invalid lock version on read', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'lock-bad-ver-'));
    dirs.push(dir);
    const lockPath = path.join(dir, 'cursor-skills.lock');
    await writeFile(
      lockPath,
      JSON.stringify({
        version: 99,
        package: { name: 'x', version: '0.1.0' },
        skills: {},
      }),
    );

    await expect(readLockfile(lockPath)).rejects.toThrow(CliError);
  });

  it('rejects malicious skill keys on read', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'lock-bad-key-'));
    dirs.push(dir);
    const lockPath = path.join(dir, 'cursor-skills.lock');
    await writeFile(
      lockPath,
      JSON.stringify({
        version: LOCK_VERSION,
        package: { name: 'x', version: '0.1.0' },
        skills: {
          '../evil': {
            source: 'x',
            sourceType: 'bundled',
            computedHash: 'a'.repeat(64),
            linkType: 'symlink',
            installedAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        },
      }),
    );

    await expect(readLockfile(lockPath)).rejects.toThrow(CliError);
  });
});
