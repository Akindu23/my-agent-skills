import { access, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
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

function githubApiHeaders(): Record<string, string> {
  return {
    'User-Agent': GITHUB_USER_AGENT,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

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

export async function extractTarballToCache(
  body: ReadableStream<Uint8Array>,
  cacheEntry: string,
  tmpSuffix: string,
): Promise<void> {
  const tmpDir = `${cacheEntry}.tmp-${tmpSuffix}`;
  await rm(tmpDir, { recursive: true, force: true });
  await mkdir(tmpDir, { recursive: true });

  try {
    await pipeline(
      Readable.fromWeb(body),
      tar.x({
        cwd: tmpDir,
        strip: 1,
        filter: tarballFilter,
        maxDepth: 20,
      }),
    );
    await validateExtracted(tmpDir);
    await rm(cacheEntry, { recursive: true, force: true });
    await rename(tmpDir, cacheEntry);
    await writeFile(path.join(cacheEntry, '.extract-complete'), 'ok');
  } catch (err) {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    if (err instanceof CliError) throw err;
    throw new CliError(
      `Failed to extract pack tarball: ${err instanceof Error ? err.message : String(err)}`,
    );
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

export async function resolveDefaultBranchHead(
  source: string,
  fetchFn: FetchFn = fetch,
): Promise<{ commit: string; defaultBranch: string }> {
  const { owner, repo } = parseGitHubSource(source);
  const repoRes = await fetchFn(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: githubApiHeaders(),
  });
  if (!repoRes.ok) {
    throw githubFetchError(repoRes.status, `GitHub repo lookup for ${source}`);
  }
  const repoData = (await repoRes.json()) as { default_branch: string };
  const branch = repoData.default_branch;

  const headRes = await fetchFn(
    `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`,
    { headers: { ...githubApiHeaders(), Accept: 'application/vnd.github.sha' } },
  );
  if (!headRes.ok) {
    throw githubFetchError(headRes.status, `GitHub commit lookup for ${source}@${branch}`);
  }
  const commit = (await headRes.text()).trim();
  return { commit, defaultBranch: branch };
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
