import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_GITHUB_SOURCE } from '../../src/lib/constants.js';
import { cacheDirFor, pruneRepoCache, resolvePackCacheBase } from '../../src/lib/remote-pack.js';

const dirs: string[] = [];

afterEach(async () => {
  const prev = process.env.CURSOR_AGENT_SKILLS_CACHE;
  for (const d of dirs) await rm(d, { recursive: true, force: true });
  dirs.length = 0;
  if (prev === undefined) delete process.env.CURSOR_AGENT_SKILLS_CACHE;
  else process.env.CURSOR_AGENT_SKILLS_CACHE = prev;
});

describe('pruneRepoCache', () => {
  it('removes sibling SHA dirs and keeps the pinned commit', async () => {
    const cacheRoot = await mkdtemp(path.join(os.tmpdir(), 'cas-cache-'));
    dirs.push(cacheRoot);
    process.env.CURSOR_AGENT_SKILLS_CACHE = cacheRoot;

    const keep = 'cccccccccccccccccccccccccccccccccccccccc';
    const old = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const keepDir = cacheDirFor(DEFAULT_GITHUB_SOURCE, keep);
    const oldDir = cacheDirFor(DEFAULT_GITHUB_SOURCE, old);
    await mkdir(keepDir, { recursive: true });
    await mkdir(oldDir, { recursive: true });
    await writeFile(path.join(keepDir, '.extract-complete'), 'ok');
    await writeFile(path.join(oldDir, '.extract-complete'), 'ok');

    await pruneRepoCache(DEFAULT_GITHUB_SOURCE, keep);

    const { access } = await import('node:fs/promises');
    await expect(access(path.join(keepDir, '.extract-complete'))).resolves.toBeUndefined();
    await expect(access(path.join(oldDir, '.extract-complete'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    expect(resolvePackCacheBase()).toBe(cacheRoot);
  });
});
