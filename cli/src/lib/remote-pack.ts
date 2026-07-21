import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import * as tar from 'tar';
import { CliError } from './errors.js';
import { GITHUB_USER_AGENT } from './constants.js';

export interface GitHubSource {
  owner: string;
  repo: string;
}

export interface PackCacheResult {
  cacheRoot: string;
  skillsRoot: string;
  manifestPath: string;
}

export type FetchFn = typeof fetch;
export type SpawnFn = typeof spawn;

const PACK_COMMIT_SHA_RE = /^[0-9a-f]{40}$/i;

export function parseGitHubSource(source: string): GitHubSource {
  const parts = source.trim().split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new CliError(`Invalid GitHub source "${source}". Expected owner/repo.`);
  }
  return { owner: parts[0], repo: parts[1] };
}

export function resolvePackCacheBase(): string {
  if (process.env.CURSOR_AGENT_SKILLS_CACHE) {
    return path.resolve(process.env.CURSOR_AGENT_SKILLS_CACHE);
  }
  if (process.platform === 'win32') {
    const base = process.env.LOCALAPPDATA ?? path.join(homedir(), 'AppData', 'Local');
    return path.join(base, 'cursor-agent-skills', 'Cache');
  }
  const xdg = process.env.XDG_CACHE_HOME;
  if (xdg) return path.join(xdg, 'cursor-agent-skills');
  if (process.platform === 'darwin') {
    return path.join(homedir(), 'Library', 'Caches', 'cursor-agent-skills');
  }
  return path.join(homedir(), '.cache', 'cursor-agent-skills');
}

export function cacheDirFor(source: string, commit: string): string {
  const { owner, repo } = parseGitHubSource(source);
  return path.join(resolvePackCacheBase(), owner, repo, commit);
}

export function tarballUrl(owner: string, repo: string, commit: string): string {
  return `https://codeload.github.com/${owner}/${repo}/tar.gz/${commit}`;
}

export function branchTarballUrl(owner: string, repo: string, branch = 'main'): string {
  return tarballUrl(owner, repo, branch);
}

export function readPackCommit(manifest: { packCommit?: unknown }): string {
  const raw = manifest.packCommit;
  if (typeof raw !== 'string' || !PACK_COMMIT_SHA_RE.test(raw)) {
    throw new CliError(
      `Invalid packCommit in skills.json: expected a 40-character hex SHA, got ${JSON.stringify(raw)}.`,
    );
  }
  return raw.toLowerCase();
}

function tarballFilter(_entryPath: string, entry: tar.ReadEntry): boolean {
  if (entry.type === 'SymbolicLink' || entry.type === 'Link') return false;
  if (entry.type === 'File' && entry.size > 50 * 1024 * 1024) return false;
  return true;
}

async function validateExtracted(cacheEntry: string): Promise<void> {
  try {
    await access(path.join(cacheEntry, 'skills.json'));
    await access(path.join(cacheEntry, 'skills'));
  } catch {
    throw new CliError(
      `Extracted pack at ${cacheEntry} is missing skills.json or skills/ directory.`,
    );
  }
}

export async function normalizeExtractedRoot(cacheEntry: string): Promise<void> {
  await validateExtracted(cacheEntry);
}

async function extractTarballBodyToDir(
  body: ReadableStream<Uint8Array>,
  targetDir: string,
): Promise<void> {
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });

  try {
    await pipeline(
      Readable.fromWeb(body),
      tar.x({
        cwd: targetDir,
        strip: 1,
        filter: tarballFilter,
        maxDepth: 20,
      }),
    );
    await validateExtracted(targetDir);
  } catch (err) {
    await rm(targetDir, { recursive: true, force: true }).catch(() => {});
    if (err instanceof CliError) throw err;
    throw new CliError(
      `Failed to extract pack tarball: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export async function extractTarballToCache(
  body: ReadableStream<Uint8Array>,
  cacheEntry: string,
  tmpSuffix: string,
): Promise<void> {
  const tmpDir = `${cacheEntry}.tmp-${tmpSuffix}`;
  await extractTarballBodyToDir(body, tmpDir);
  try {
    await rm(cacheEntry, { recursive: true, force: true });
    await rename(tmpDir, cacheEntry);
    await writeFile(path.join(cacheEntry, '.extract-complete'), 'ok');
  } catch (err) {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    throw err;
  }
}

function githubFetchError(status: number, context: string): CliError {
  if (status === 404) {
    return new CliError(`${context}: not found (404). Check owner/repo and commit SHA.`);
  }
  if (status === 403 || status === 429) {
    return new CliError(
      `${context}: GitHub rate limit or access denied (${status}). Try again later.`,
    );
  }
  return new CliError(`${context}: HTTP ${status}`);
}

function parseLsRemoteHead(stdout: string): string {
  const line = stdout
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!line) {
    throw new CliError('git ls-remote returned no HEAD ref.');
  }
  const sha = line.split(/\s+/)[0];
  if (!sha || !PACK_COMMIT_SHA_RE.test(sha)) {
    throw new CliError(`git ls-remote returned unexpected HEAD: ${line}`);
  }
  return sha.toLowerCase();
}

export function resolveHeadViaLsRemote(
  source: string,
  spawnFn: SpawnFn = spawn,
): Promise<string> {
  const { owner, repo } = parseGitHubSource(source);
  const repoUrl = `https://github.com/${owner}/${repo}.git`;

  return new Promise((resolve, reject) => {
    let child: ChildProcessWithoutNullStreams;
    try {
      child = spawnFn('git', ['ls-remote', repoUrl, 'HEAD'], {
        stdio: ['ignore', 'pipe', 'pipe'],
      }) as ChildProcessWithoutNullStreams;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        reject(
          new CliError(
            'git is not installed or not on PATH. Install Git, or wait for CI to stamp packCommit in skills.json.',
          ),
        );
        return;
      }
      reject(err);
      return;
    }

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(
          new CliError(
            'git is not installed or not on PATH. Install Git, or wait for CI to stamp packCommit in skills.json.',
          ),
        );
        return;
      }
      reject(err);
    });
    child.on('close', (code) => {
      if (code !== 0) {
        reject(
          new CliError(
            `git ls-remote failed for ${source} (exit ${code ?? 'unknown'}): ${stderr.trim() || 'no stderr'}`,
          ),
        );
        return;
      }
      try {
        resolve(parseLsRemoteHead(stdout));
      } catch (err) {
        reject(err);
      }
    });
  });
}

export async function resolveLatestPackCommit(
  source: string,
  fetchFn: FetchFn = fetch,
  spawnFn: SpawnFn = spawn,
): Promise<string> {
  const { owner, repo } = parseGitHubSource(source);
  const url = branchTarballUrl(owner, repo);
  const res = await fetchFn(url, {
    headers: { 'User-Agent': GITHUB_USER_AGENT, Accept: '*/*' },
  });
  if (!res.ok) {
    throw githubFetchError(res.status, `GitHub branch tarball fetch for ${source}`);
  }
  if (!res.body) {
    throw new CliError(`GitHub branch tarball fetch for ${source}: empty response body`);
  }

  const bootstrapDir = await mkdtemp(path.join(tmpdir(), 'cursor-agent-skills-bootstrap-'));
  try {
    await extractTarballBodyToDir(res.body, bootstrapDir);
    const manifestPath = path.join(bootstrapDir, 'skills.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
      packCommit?: unknown;
    };
    if (manifest.packCommit !== undefined && manifest.packCommit !== null) {
      return readPackCommit(manifest);
    }
    return resolveHeadViaLsRemote(source, spawnFn);
  } finally {
    await rm(bootstrapDir, { recursive: true, force: true }).catch(() => {});
  }
}

/** Remove one SHA extract dir for owner/repo (best-effort). Leaves sibling SHAs alone. */
export async function pruneCommitCache(source: string, commitToRemove: string): Promise<void> {
  if (!commitToRemove || commitToRemove === 'local') return;
  const target = cacheDirFor(source, commitToRemove);
  try {
    await rm(target, { recursive: true, force: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
    console.warn(
      `Could not prune cache entry ${target}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export async function ensurePackAtCommit(
  source: string,
  commit: string,
  fetchFn: FetchFn = fetch,
): Promise<PackCacheResult> {
  const { owner, repo } = parseGitHubSource(source);
  const cacheEntry = cacheDirFor(source, commit);
  const marker = path.join(cacheEntry, '.extract-complete');
  const skillsRoot = path.join(cacheEntry, 'skills');
  const manifestPath = path.join(cacheEntry, 'skills.json');

  try {
    await access(marker);
    await access(skillsRoot);
    await access(manifestPath);
    return { cacheRoot: cacheEntry, skillsRoot, manifestPath };
  } catch {
    /* cache miss */
  }

  const url = tarballUrl(owner, repo, commit);
  const res = await fetchFn(url, {
    headers: { 'User-Agent': GITHUB_USER_AGENT, Accept: '*/*' },
  });
  if (!res.ok) {
    throw githubFetchError(res.status, `GitHub tarball fetch for ${source}@${commit}`);
  }
  if (!res.body) {
    throw new CliError(`GitHub tarball fetch for ${source}@${commit}: empty response body`);
  }

  await extractTarballToCache(res.body, cacheEntry, String(process.pid));
  return { cacheRoot: cacheEntry, skillsRoot, manifestPath };
}
