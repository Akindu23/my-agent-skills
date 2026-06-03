import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_GITHUB_SOURCE } from '../../src/lib/constants.js';
import { CliError } from '../../src/lib/errors.js';
import {
  cacheDirFor,
  ensurePackAtCommit,
  parseGitHubSource,
  resolveDefaultBranchHead,
  resolvePackCacheBase,
  tarballUrl,
} from '../../src/lib/remote-pack.js';

const tmpDirs: string[] = [];

afterEach(async () => {
  for (const d of tmpDirs.splice(0)) {
    await rm(d, { recursive: true, force: true });
  }
  vi.unstubAllGlobals();
  delete process.env.CURSOR_AGENT_SKILLS_CACHE;
  delete process.env.XDG_CACHE_HOME;
  delete process.env.LOCALAPPDATA;
});

describe('parseGitHubSource', () => {
  it('parses owner/repo', () => {
    expect(parseGitHubSource('Akindu23/my-agent-skills')).toEqual({
      owner: 'Akindu23',
      repo: 'my-agent-skills',
    });
  });

  it('rejects invalid source', () => {
    expect(() => parseGitHubSource('not-valid')).toThrow(CliError);
  });
});

describe('resolvePackCacheBase', () => {
  it('uses CURSOR_AGENT_SKILLS_CACHE when set', () => {
    const dir = path.join(os.tmpdir(), 'cas-cache-override');
    process.env.CURSOR_AGENT_SKILLS_CACHE = dir;
    expect(resolvePackCacheBase()).toBe(path.resolve(dir));
  });

  it('uses XDG_CACHE_HOME on unix when set', () => {
    const xdg = path.join(os.tmpdir(), 'xdg-cache-test');
    process.env.XDG_CACHE_HOME = xdg;
    vi.stubGlobal('process', { ...process, platform: 'linux' });
    expect(resolvePackCacheBase()).toBe(path.join(xdg, 'cursor-agent-skills'));
  });

  it('uses LOCALAPPDATA on win32', () => {
    const local = path.join(os.tmpdir(), 'local-appdata-test');
    process.env.LOCALAPPDATA = local;
    vi.stubGlobal('process', { ...process, platform: 'win32' });
    expect(resolvePackCacheBase()).toBe(
      path.join(local, 'cursor-agent-skills', 'Cache'),
    );
  });
});

describe('cacheDirFor', () => {
  it('nests owner/repo/sha under cache base', () => {
    process.env.CURSOR_AGENT_SKILLS_CACHE = '/tmp/cas-test-cache';
    const sha = 'a'.repeat(40);
    expect(cacheDirFor(DEFAULT_GITHUB_SOURCE, sha)).toBe(
      path.join('/tmp/cas-test-cache', 'Akindu23', 'my-agent-skills', sha),
    );
  });
});

describe('tarballUrl', () => {
  it('builds codeload URL for pinned SHA', () => {
    const sha = 'abc123';
    expect(tarballUrl('owner', 'repo', sha)).toBe(
      'https://codeload.github.com/owner/repo/tar.gz/abc123',
    );
  });
});

describe('resolveDefaultBranchHead', () => {
  it('resolves default branch HEAD via GitHub API', async () => {
    const sha = 'd'.repeat(40);
    const fetchFn = vi.fn(async (url: string) => {
      if (url.endsWith('/repos/o/r')) {
        return new Response(JSON.stringify({ default_branch: 'main' }), { status: 200 });
      }
      if (url.includes('/commits/main')) {
        return new Response(sha, { status: 200 });
      }
      throw new Error(`unexpected url ${url}`);
    });

    const result = await resolveDefaultBranchHead('o/r', fetchFn);
    expect(result).toEqual({ commit: sha, defaultBranch: 'main' });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('throws CliError on rate limit', async () => {
    const fetchFn = vi.fn(async () => new Response('', { status: 403 }));
    await expect(resolveDefaultBranchHead('o/r', fetchFn)).rejects.toThrow(CliError);
  });
});

describe('ensurePackAtCommit', () => {
  it('returns cache hit without fetch', async () => {
    const cacheBase = await mkdtemp(path.join(os.tmpdir(), 'cas-pack-hit-'));
    tmpDirs.push(cacheBase);
    process.env.CURSOR_AGENT_SKILLS_CACHE = cacheBase;

    const sha = 'e'.repeat(40);
    const cacheRoot = cacheDirFor(DEFAULT_GITHUB_SOURCE, sha);
    await mkdir(cacheRoot, { recursive: true });
    await writeFile(path.join(cacheRoot, '.extract-complete'), 'ok');
    await writeFile(path.join(cacheRoot, 'skills.json'), '{}');
    await mkdir(path.join(cacheRoot, 'skills'));

    const fetchFn = vi.fn();
    const result = await ensurePackAtCommit(DEFAULT_GITHUB_SOURCE, sha, fetchFn);

    expect(result.cacheRoot).toBe(cacheRoot);
    expect(result.skillsRoot).toBe(path.join(cacheRoot, 'skills'));
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
