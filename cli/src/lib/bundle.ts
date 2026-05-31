import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CliError } from './errors.js';
import { resolveSkillSourceDir } from './skill-paths.js';

export interface SkillsManifest {
  schema_version: number;
  name: string;
  version: string;
  skills: string[];
  dependsOn: Record<string, string[]>;
}

export interface BundleContext {
  root: string;
  manifest: SkillsManifest;
  packageName: string;
  packageVersion: string;
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
 * canonical skill tree is repo-root `skills/`. Prefer that layout over the
 * publish-time mirror at `cli/skills/` unless the user overrides via env/flag.
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

async function resolveBundleRoot(opts: { source?: string }): Promise<string> {
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

  return path.join(pkgDir, 'skills');
}

export async function resolveBundle(opts: {
  source?: string;
  packageName?: string;
  packageVersion?: string;
}): Promise<BundleContext> {
  const root = await resolveBundleRoot(opts);

  const manifestPath = path.join(path.dirname(root), 'skills.json');
  let manifestRaw: string;
  try {
    manifestRaw = await readFile(manifestPath, 'utf8');
  } catch {
    throw new CliError(
      `Could not read skills.json next to bundle at ${root}. Set --source or CURSOR_AGENT_SKILLS_ROOT.`,
    );
  }

  const manifest = JSON.parse(manifestRaw) as SkillsManifest;
  await validateBundle(root, manifest);

  const pkgJsonPath = path.join(path.dirname(root), 'package.json');
  let packageName = opts.packageName ?? 'cursor-agent-skills';
  let packageVersion = opts.packageVersion ?? '0.1.0';
  try {
    const pkg = JSON.parse(await readFile(pkgJsonPath, 'utf8')) as {
      name?: string;
      version?: string;
    };
    if (pkg.name) packageName = pkg.name;
    if (pkg.version) packageVersion = pkg.version;
  } catch {
    /* use defaults when bundle root is not next to a package.json */
  }

  return { root, manifest, packageName, packageVersion };
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
