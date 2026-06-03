import { EventEmitter } from 'node:events';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as tar from 'tar';
import { DEFAULT_GITHUB_SOURCE } from '../../src/lib/constants.js';
import { CliError } from '../../src/lib/errors.js';
import {
  branchTarballUrl,
  cacheDirFor,
  ensurePackAtCommit,
  parseGitHubSource,
  readPackCommit,
  resolveHeadViaLsRemote,
  resolveLatestPackCommit,
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

async function buildBranchTarball(manifest: Record<string, unknown>): Promise<Buffer> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cas-tar-build-'));
  tmpDirs.push(root);
  const prefix = 'pack-main';
  const base = path.join(root, prefix);
  await mkdir(path.join(base, 'skills', 'foo'), { recursive: true });
  await writeFile(path.join(base, 'skills.json'), JSON.stringify(manifest));
  await writeFile(path.join(base, 'skills', 'foo', 'SKILL.md'), '# fixture\n');
  const tarPath = path.join(root, 'out.tar.gz');
  await tar.c({ gzip: true, file: tarPath, cwd: root }, [prefix]);
  return readFile(tarPath);
}

function mockSpawn(stdout: string, options?: { error?: NodeJS.ErrnoException; exitCode?: number }) {
  return vi.fn(() => {
    const child = new EventEmitter() as EventEmitter & {
      stdout: Readable;
      stderr: Readable;
    };
    child.stdout = new Readable({ read() {} });
    child.stderr = new Readable({ read() {} });
    queueMicrotask(() => {
      if (options?.error) {
        child.emit('error', options.error);
        return;
      }
      child.stdout.emit('data', Buffer.from(stdout));
      child.emit('close', options?.exitCode ?? 0);
    });
    return child;
  });
}

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

describe('branchTarballUrl', () => {
  it('defaults to main branch tarball', () => {
    expect(branchTarballUrl('owner', 'repo')).toBe(
      'https://codeload.github.com/owner/repo/tar.gz/main',
    );
  });
});

describe('readPackCommit', () => {
  it('returns normalized lowercase SHA', () => {
    const sha = 'A'.repeat(40);
    expect(readPackCommit({ packCommit: sha })).toBe(sha.toLowerCase());
  });

  it('throws on invalid packCommit', () => {
    expect(() => readPackCommit({ packCommit: 'short' })).toThrow(CliError);
  });
});

describe('resolveHeadViaLsRemote', () => {
  it('parses HEAD from git ls-remote stdout', async () => {
    const sha = 'b'.repeat(40);
    const spawnFn = mockSpawn(`${sha}\tHEAD\n`);
    await expect(resolveHeadViaLsRemote('o/r', spawnFn)).resolves.toBe(sha);
    expect(spawnFn).toHaveBeenCalledWith(
      'git',
      ['ls-remote', 'https://github.com/o/r.git', 'HEAD'],
      expect.objectContaining({ stdio: ['ignore', 'pipe', 'pipe'] }),
    );
  });

  it('throws when git is missing', async () => {
    const spawnFn = mockSpawn('', { error: Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' }) });
    await expect(resolveHeadViaLsRemote('o/r', spawnFn)).rejects.toThrow(/git is not installed/i);
  });
});

describe('resolveLatestPackCommit', () => {
  it('reads packCommit from branch tarball without api.github.com', async () => {
    const sha = 'c'.repeat(40);
    const tarball = await buildBranchTarball({
      schema_version: 1,
      name: 'test',
      version: '0.0.0',
      packCommit: sha,
      skills: ['skills/foo'],
      dependsOn: {},
    });
    const fetchFn = vi.fn(async (url: string) => {
      expect(url).toBe('https://codeload.github.com/o/r/tar.gz/main');
      expect(url).not.toContain('api.github.com');
      return new Response(tarball, { status: 200 });
    });
    const spawnFn = mockSpawn('should-not-run');

    const commit = await resolveLatestPackCommit('o/r', fetchFn, spawnFn);
    expect(commit).toBe(sha);
    expect(spawnFn).not.toHaveBeenCalled();
    for (const call of fetchFn.mock.calls) {
      expect(String(call[0])).not.toContain('api.github.com');
    }
  });

  it('falls back to git ls-remote when packCommit is missing', async () => {
    const lsSha = 'd'.repeat(40);
    const tarball = await buildBranchTarball({
      schema_version: 1,
      name: 'test',
      version: '0.0.0',
      skills: ['skills/foo'],
      dependsOn: {},
    });
    const fetchFn = vi.fn(async () => new Response(tarball, { status: 200 }));
    const spawnFn = mockSpawn(`${lsSha}\tHEAD\n`);

    const commit = await resolveLatestPackCommit('o/r', fetchFn, spawnFn);
    expect(commit).toBe(lsSha);
    expect(spawnFn).toHaveBeenCalled();
  });

  it('throws CliError on branch tarball rate limit', async () => {
    const fetchFn = vi.fn(async () => new Response('', { status: 403 }));
    await expect(resolveLatestPackCommit('o/r', fetchFn)).rejects.toThrow(CliError);
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
