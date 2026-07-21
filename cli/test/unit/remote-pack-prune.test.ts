import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_GITHUB_SOURCE } from '../../src/lib/constants.js';
import { cacheDirFor, pruneCommitCache, resolvePackCacheBase } from '../../src/lib/remote-pack.js';

const dirs: string[] = [];

afterEach(async () => {
  const prev = process.env.CURSOR_AGENT_SKILLS_CACHE;
  for (const d of dirs) await rm(d, { recursive: true, force: true });
  dirs.length = 0;
  if (prev === undefined) delete process.env.CURSOR_AGENT_SKILLS_CACHE;
  else process.env.CURSOR_AGENT_SKILLS_CACHE = prev;
});

describe('pruneCommitCache', () => {
  it('removes only the replaced pin SHA and keeps unrelated siblings', async () => {
    const cacheRoot = await mkdtemp(path.join(os.tmpdir(), 'cas-cache-'));
    dirs.push(cacheRoot);
    process.env.CURSOR_AGENT_SKILLS_CACHE = cacheRoot;

    const keep = 'cccccccccccccccccccccccccccccccccccccccc';
    const oldPin = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const unrelated = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const keepDir = cacheDirFor(DEFAULT_GITHUB_SOURCE, keep);
    const oldDir = cacheDirFor(DEFAULT_GITHUB_SOURCE, oldPin);
    const unrelatedDir = cacheDirFor(DEFAULT_GITHUB_SOURCE, unrelated);
    await mkdir(keepDir, { recursive: true });
    await mkdir(oldDir, { recursive: true });
    await mkdir(unrelatedDir, { recursive: true });
    await writeFile(path.join(keepDir, '.extract-complete'), 'ok');
    await writeFile(path.join(oldDir, '.extract-complete'), 'ok');
    await writeFile(path.join(unrelatedDir, '.extract-complete'), 'ok');

    await pruneCommitCache(DEFAULT_GITHUB_SOURCE, oldPin);

    await expect(access(path.join(keepDir, '.extract-complete'))).resolves.toBeUndefined();
    await expect(access(path.join(unrelatedDir, '.extract-complete'))).resolves.toBeUndefined();
    await expect(access(path.join(oldDir, '.extract-complete'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    expect(resolvePackCacheBase()).toBe(cacheRoot);
  });
});
