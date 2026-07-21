import {
  isLocalOverride,
  resolveBundle,
  readSkillFrontmatterName,
  skillSourcePath,
  type BundleContext,
} from './bundle.js';
import { expandDependencies } from './deps.js';
import { CliError } from './errors.js';
import { computeSkillFolderHash } from './hash.js';
import { resolvePlannedInstallAction } from './install-policy.js';
import {
  resolveEffectiveTargets,
  resolveTargetSkillsDir,
  sortUniqueTargets,
  type InstallTarget,
} from './install-targets.js';
import { resolveSkillDestDir } from './skill-paths.js';
import {
  emptyLockfile,
  readLockfile,
  resolveDefaultLinkType,
  syncLockRootFromBundle,
  type DefaultLinkType,
  type Lockfile,
} from './lockfile.js';
import type { ScopePaths } from './scope.js';

export type PlannedInstallAction = 'new' | 'skip' | 'update' | 'confirm';
export type PlannedLinkType = 'symlink' | 'copy';

export interface InstallPlanEntry {
  name: string;
  target: InstallTarget;
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
  targets: InstallTarget[];
  lock: Lockfile;
  entries: InstallPlanEntry[];
}

export async function createInstallPlan(opts: {
  source?: string;
  bundle?: BundleContext;
  selected: string[];
  scope: ScopePaths;
  copy?: boolean;
  linkType?: DefaultLinkType;
  /** Explicit targets for this install; defaults to lock effective targets. */
  targets?: readonly InstallTarget[];
}): Promise<InstallPlan> {
  const existingLock = await readLockfile(opts.scope.lockPath);
  const bundle =
    opts.bundle ??
    (await resolveBundle({
      source: opts.source,
      githubSource: existingLock?.source,
      // Pass pin unless explicit local override (which may intentionally use "local").
      ...(isLocalOverride({ source: opts.source })
        ? {}
        : { commit: existingLock?.commit || undefined }),
    }));
  const resolvedLinkType: PlannedLinkType =
    opts.linkType ?? (opts.copy ? 'copy' : existingLock ? resolveDefaultLinkType(existingLock) : 'symlink');

  const lock =
    existingLock ??
    emptyLockfile({
      source: bundle.githubSource,
      commit: bundle.commit,
      package: { name: bundle.packageName, version: bundle.packageVersion },
      defaultLinkType: resolvedLinkType,
    });
  if (!existingLock) {
    lock.defaultLinkType = resolvedLinkType;
  } else if (opts.linkType) {
    lock.defaultLinkType = opts.linkType;
  }
  syncLockRootFromBundle(lock, bundle);

  const targets = sortUniqueTargets(
    opts.targets ?? resolveEffectiveTargets(existingLock),
  );

  const { ordered, addedBy } = expandDependencies(bundle.manifest, opts.selected);
  const linkType: PlannedLinkType = resolvedLinkType;
  const entries: InstallPlanEntry[] = [];

  for (const name of ordered) {
    const sourceDir = skillSourcePath(bundle, name);
    const frontmatterName = await readSkillFrontmatterName(sourceDir);
    if (frontmatterName !== name) {
      throw new CliError(
        `Skill folder "${name}" does not match SKILL.md name "${frontmatterName}"`,
      );
    }

    const computedHash = await computeSkillFolderHash(sourceDir);
    const dependencyOf = addedBy.get(name);

    for (const target of targets) {
      const destDir = resolveSkillDestDir(resolveTargetSkillsDir(opts.scope, target), name);
      const action = await resolvePlannedInstallAction({
        destDir,
        bundleHash: computedHash,
        lockEntry: lock.skills[name],
        plannedLinkType: linkType,
      });

      entries.push({
        name,
        target,
        sourceDir,
        destDir,
        computedHash,
        action,
        linkType,
        dependencyOf,
      });
    }
  }

  return {
    bundle,
    scope: opts.scope,
    selected: opts.selected,
    ordered,
    dependencyCount: ordered.length - opts.selected.length,
    linkType,
    targets,
    lock,
    entries,
  };
}
