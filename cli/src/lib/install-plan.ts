import {
  resolveBundle,
  readSkillFrontmatterName,
  skillSourcePath,
  type BundleContext,
} from './bundle.js';
import { expandDependencies } from './deps.js';
import { CliError } from './errors.js';
import { computeSkillFolderHash } from './hash.js';
import { resolvePlannedInstallAction } from './install-policy.js';
import { resolveSkillDestDir } from './skill-paths.js';
import {
  emptyLockfile,
  readLockfile,
  syncLockRootFromBundle,
  type Lockfile,
} from './lockfile.js';
import type { ScopePaths } from './scope.js';

export type PlannedInstallAction = 'new' | 'skip' | 'update' | 'confirm';
export type PlannedLinkType = 'symlink' | 'copy';

export interface InstallPlanEntry {
  name: string;
  sourceDir: string;
  destDir: string;
  computedHash: string;
  action: PlannedInstallAction;
  linkType: PlannedLinkType;
  dependencyOf?: string;
}

export interface InstallPlan {
  bundle: BundleContext;
  scope: ScopePaths;
  selected: string[];
  ordered: string[];
  dependencyCount: number;
  linkType: PlannedLinkType;
  lock: Lockfile;
  entries: InstallPlanEntry[];
}

export async function createInstallPlan(opts: {
  source?: string;
  bundle?: BundleContext;
  selected: string[];
  scope: ScopePaths;
  copy?: boolean;
}): Promise<InstallPlan> {
  const existingLock = await readLockfile(opts.scope.lockPath);
  const bundle = opts.bundle ?? (await resolveBundle({ source: opts.source }));
  const lock =
    existingLock ??
    emptyLockfile({
      source: bundle.githubSource,
      commit: bundle.commit,
      package: { name: bundle.packageName, version: bundle.packageVersion },
    });
  syncLockRootFromBundle(lock, bundle);

  const { ordered, addedBy } = expandDependencies(bundle.manifest, opts.selected);
  const linkType: PlannedLinkType = opts.copy ? 'copy' : 'symlink';
  const entries: InstallPlanEntry[] = [];

  for (const name of ordered) {
    const sourceDir = skillSourcePath(bundle, name);
    const frontmatterName = await readSkillFrontmatterName(sourceDir);
    if (frontmatterName !== name) {
      throw new CliError(
        `Skill folder "${name}" does not match SKILL.md name "${frontmatterName}"`,
      );
    }

    const destDir = resolveSkillDestDir(opts.scope.skillsDir, name);
    const computedHash = await computeSkillFolderHash(sourceDir);
    const action = await resolvePlannedInstallAction({
      destDir,
      bundleHash: computedHash,
      lockEntry: lock.skills[name],
    });

    entries.push({
      name,
      sourceDir,
      destDir,
      computedHash,
      action,
      linkType,
      dependencyOf: addedBy.get(name),
    });
  }

  return {
    bundle,
    scope: opts.scope,
    selected: opts.selected,
    ordered,
    dependencyCount: ordered.length - opts.selected.length,
    linkType,
    lock,
    entries,
  };
}
