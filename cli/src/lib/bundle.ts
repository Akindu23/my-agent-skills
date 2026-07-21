import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_GITHUB_SOURCE } from './constants.js';
import { CliError } from './errors.js';
import {
  ensurePackAtCommit,
  readPackCommit,
  resolveLatestPackCommit,
  type PackCacheResult,
} from './remote-pack.js';
import { resolveSkillSourceDir } from './skill-paths.js';

export interface SkillsManifest {
  schema_version: number;
  name: string;
  version: string;
  skills: string[];
  dependsOn: Record<string, string[]>;
  packCommit?: string;
}

export interface BundleContext {
  root: string;
  manifest: SkillsManifest;
  packageName: string;
  packageVersion: string;
  githubSource: string;
  commit: string;
  cacheRoot: string;
}

export function packageRoot(): string {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  // Built bundle lives in dist/; source (vitest) lives in src/lib/
  return path.basename(dir) === 'dist'
    ? path.resolve(dir, '..')
    : path.resolve(dir, '../..');
}

/**
 * When developing from a git clone, the CLI package lives in `cli/` while the
 * canonical skill tree is repo-root `skills/`. Prefer that layout over remote
 * fetch unless the user overrides via env/flag.
 */
export async function detectMonorepoSkillsRoot(cliPackageDir: string): Promise<string | null> {
  const repoRoot = path.resolve(cliPackageDir, '..');
  const skillsDir = path.join(repoRoot, 'skills');
  const manifestPath = path.join(repoRoot, 'skills.json');

  try {
    await access(skillsDir);
    await access(manifestPath);
  } catch {
    return null;
  }

  let manifest: SkillsManifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as SkillsManifest;
  } catch {
    return null;
  }

  if (!Array.isArray(manifest.skills) || manifest.skills.length === 0) {
    return null;
  }

  const first = manifest.skills[0]!;
  const skillMd = path.join(repoRoot, first, 'SKILL.md');
  try {
    await access(skillMd);
  } catch {
    return null;
  }

  return skillsDir;
}

function isLocalOverride(opts: { source?: string }): boolean {
  if (opts.source) return true;
  if (process.env.CURSOR_AGENT_SKILLS_ROOT) return true;
  return false;
}

async function resolveLocalBundleRoot(opts: { source?: string }): Promise<string | null> {
  if (opts.source) {
    return path.resolve(opts.source);
  }
  if (process.env.CURSOR_AGENT_SKILLS_ROOT) {
    return path.resolve(process.env.CURSOR_AGENT_SKILLS_ROOT);
  }

  const pkgDir = packageRoot();
  const monorepoSkills = await detectMonorepoSkillsRoot(pkgDir);
  if (monorepoSkills) {
    return monorepoSkills;
  }

  return null;
}

async function resolveRemotePack(
  githubSource: string,
  commit?: string,
): Promise<{ root: string; pack: PackCacheResult; commit: string }> {
  let resolvedCommit = commit;
  if (!resolvedCommit) {
    resolvedCommit = await resolveLatestPackCommit(githubSource);
  }

  const pack = await ensurePackAtCommit(githubSource, resolvedCommit);
  return { root: pack.skillsRoot, pack, commit: resolvedCommit };
}

async function resolveBundleRoot(opts: {
  source?: string;
  githubSource?: string;
  commit?: string;
}): Promise<{
  root: string;
  githubSource: string;
  commit: string;
  cacheRoot: string;
}> {
  const localRoot = await resolveLocalBundleRoot(opts);
  if (localRoot) {
    const cacheRoot = path.dirname(localRoot);
    const githubSource = opts.githubSource ?? DEFAULT_GITHUB_SOURCE;

    // Explicit override may persist commit "local". Monorepo auto-detect must not.
    if (isLocalOverride(opts)) {
      return {
        root: localRoot,
        githubSource,
        commit: opts.commit ?? 'local',
        cacheRoot,
      };
    }

    let commit = opts.commit;
    if (!commit) {
      try {
        const manifestRaw = await readFile(path.join(cacheRoot, 'skills.json'), 'utf8');
        commit = readPackCommit(JSON.parse(manifestRaw) as { packCommit?: unknown });
      } catch {
        commit = await resolveLatestPackCommit(githubSource);
      }
    }

    return {
      root: localRoot,
      githubSource,
      commit,
      cacheRoot,
    };
  }

  const githubSource = opts.githubSource ?? DEFAULT_GITHUB_SOURCE;
  const remote = await resolveRemotePack(githubSource, opts.commit);
  return {
    root: remote.root,
    githubSource,
    commit: remote.commit,
    cacheRoot: remote.pack.cacheRoot,
  };
}

export async function resolveBundle(opts: {
  source?: string;
  githubSource?: string;
  commit?: string;
  packageName?: string;
  packageVersion?: string;
}): Promise<BundleContext> {
  const { root, githubSource, commit, cacheRoot } = await resolveBundleRoot(opts);

  const manifestPath = path.join(path.dirname(root), 'skills.json');
  let manifestRaw: string;
  try {
    manifestRaw = await readFile(manifestPath, 'utf8');
  } catch {
    throw new CliError(
      `Could not read skills.json next to skills root at ${root}. Set --source or CURSOR_AGENT_SKILLS_ROOT.`,
    );
  }

  const manifest = JSON.parse(manifestRaw) as SkillsManifest;
  await validateBundle(root, manifest);

  const packageName = opts.packageName ?? manifest.name;
  const packageVersion = opts.packageVersion ?? manifest.version;

  return {
    root,
    manifest,
    packageName,
    packageVersion,
    githubSource,
    commit,
    cacheRoot,
  };
}

async function validateBundle(root: string, manifest: SkillsManifest): Promise<void> {
  try {
    await access(root);
  } catch {
    throw new CliError(`Skills bundle directory not found: ${root}`);
  }

  for (const rel of manifest.skills) {
    const skillMd = path.join(path.dirname(root), rel, 'SKILL.md');
    try {
      await access(skillMd);
    } catch {
      throw new CliError(`Bundle missing ${rel}/SKILL.md`);
    }
  }
}

export function skillNamesFromManifest(manifest: SkillsManifest): string[] {
  return manifest.skills.map((p) => {
    const parts = p.split('/');
    return parts[parts.length - 1]!;
  });
}

export function skillSourcePath(bundle: BundleContext, name: string): string {
  return resolveSkillSourceDir(bundle.root, name);
}

export async function readSkillFrontmatterName(skillDir: string): Promise<string> {
  const content = await readFile(path.join(skillDir, 'SKILL.md'), 'utf8');
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) throw new CliError(`Missing frontmatter in ${skillDir}/SKILL.md`);
  const nameLine = match[1].split('\n').find((l) => l.startsWith('name:'));
  if (!nameLine) throw new CliError(`Missing name in ${skillDir}/SKILL.md`);
  return nameLine.replace(/^name:\s*/, '').trim();
}

export { isLocalOverride };
