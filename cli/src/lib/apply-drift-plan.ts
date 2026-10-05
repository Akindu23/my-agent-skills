import { rm } from 'node:fs/promises';
import { skillSourcePath } from './bundle.js';
import { expandDependencies } from './deps.js';
import {
  classifyDriftSummary,
  contentChangedSkillNames,
  isLockedEntry,
  type DriftPlan,
} from './drift-plan.js';
import { computeSkillFolderHash } from './hash.js';
import { materializeFromLockEntry, pathExists } from './install.js';
import {
  ensureTargetSkillsDirs,
  resolveEffectiveTargets,
  resolveTargetSkillsDir,
  type InstallTarget,
} from './install-targets.js';
import {
  removeSkill,
  resolveDefaultLinkType,
  syncLockRootFromBundle,
  upsertSkill,
  writeLockfile,
} from './lockfile.js';
import { pruneCommitCache } from './remote-pack.js';
import { resolveSkillDestDir } from './skill-paths.js';
import { CliError } from './errors.js';

/** One unlocked skill this update will install, in install order. */
export type InstallItem =
  | { name: string; role: 'root' }
  | { name: string; role: 'dependency'; requiredBy: string };

export interface InstallSet {
  items: InstallItem[];
  /** Unlocked skills left alone because a dest dir already exists and is not in the lock. */
  unmanaged: string[];
}

export interface ApplyDriftResult {
  updated: string[];
  contentChanged: string[];
  orphansRemoved: string[];
  orphansSkipped: string[];
  dependenciesAdded: string[];
  dependenciesSkipped: string[];
  newSkillsAdded: string[];
  newSkillsSkipped: string[];
  /** For each added dependency: the skill that required it. */
  requiredBy: Record<string, string>;
}

export function describeInstall(item: InstallItem): string {
  return item.role === 'root'
    ? `${item.name} (new skill)`
    : `${item.name} (required by ${item.requiredBy})`;
}

/**
 * Accepted missing dependencies, then the chosen new pack skills with every
 * unlocked skill their dependsOn closure needs. Pure; dest dirs are not checked.
 */
export function resolveInstallSet(
  plan: DriftPlan,
  opts: { dependenciesToInstall: ReadonlySet<string>; newSkillsToInstall: ReadonlySet<string> },
): InstallItem[] {
  const items: InstallItem[] = [];
  const seen = new Set<string>();
  const push = (item: InstallItem): void => {
    if (seen.has(item.name)) return;
    seen.add(item.name);
    items.push(item);
  };

  for (const e of plan.entries) {
    if (e.status === 'missingDependency' && opts.dependenciesToInstall.has(e.name)) {
      push({ name: e.name, role: 'dependency', requiredBy: e.dependencyOf ?? 'installed skill' });
    }
  }

  const roots = new Set(
    plan.entries
      .filter((e) => e.status === 'newSkill' && opts.newSkillsToInstall.has(e.name))
      .map((e) => e.name),
  );
  if (roots.size === 0) return items;

  const manifest = (plan.remoteBundle ?? plan.bundle).manifest;
  const { ordered, addedBy } = expandDependencies(manifest, [...roots]);
  for (const name of ordered) {
    if (plan.lock.skills[name]) continue;
    if (roots.has(name)) push({ name, role: 'root' });
    else push({ name, role: 'dependency', requiredBy: addedBy.get(name)! });
  }
  return items;
}

/**
 * Resolve the install set and drop anything whose dest already exists on any
 * target. The lock does not own those dirs, so they are never replaced.
 */
export async function planInstalls(
  plan: DriftPlan,
  opts: { dependenciesToInstall: ReadonlySet<string>; newSkillsToInstall: ReadonlySet<string> },
): Promise<InstallSet> {
  const targets = resolveEffectiveTargets(plan.lock);
  const occupied = async (name: string): Promise<boolean> => {
    for (const target of targets) {
      if (await pathExists(destDirFor(plan, target, name))) return true;
    }
    return false;
  };

  const unmanaged: string[] = [];
  const newSkillsToInstall = new Set<string>();
  for (const name of opts.newSkillsToInstall) {
    if (await occupied(name)) unmanaged.push(name);
    else newSkillsToInstall.add(name);
  }

  const items: InstallItem[] = [];
  for (const item of resolveInstallSet(plan, { ...opts, newSkillsToInstall })) {
    if (await occupied(item.name)) unmanaged.push(item.name);
    else items.push(item);
  }
  return { items, unmanaged };
}

export function planHasWork(plan: DriftPlan, result: ApplyDriftResult): boolean {
  return (
    plan.commitDrift ||
    plan.manifestDrift ||
    plan.entries.some((e) => e.status === 'hashDrift') ||
    result.orphansRemoved.length > 0 ||
    result.dependenciesAdded.length > 0
  );
}

function destDirFor(plan: DriftPlan, target: InstallTarget, name: string): string {
  return resolveSkillDestDir(resolveTargetSkillsDir(plan.scope, target), name);
}

interface MaterializeOutcome {
  linkType: 'symlink' | 'copy';
  failed: boolean;
  /** Every dest touched, pushed before materializing so partial copies are tracked too. */
  dests: string[];
}

async function materializeAcrossTargets(opts: {
  plan: DriftPlan;
  targets: InstallTarget[];
  name: string;
  sourceDir: string;
  linkType: 'symlink' | 'copy';
}): Promise<MaterializeOutcome> {
  const outcome: MaterializeOutcome = { linkType: opts.linkType, failed: false, dests: [] };
  for (const target of opts.targets) {
    const destDir = destDirFor(opts.plan, target, opts.name);
    outcome.dests.push(destDir);
    try {
      outcome.linkType = await materializeFromLockEntry({
        sourceDir: opts.sourceDir,
        destDir,
        linkType: opts.linkType,
      });
    } catch {
      outcome.failed = true;
    }
  }
  return outcome;
}

export async function applyDriftPlan(
  plan: DriftPlan,
  opts: { orphansToRemove: ReadonlySet<string>; installs: InstallItem[] },
): Promise<ApplyDriftResult> {
  const targets = resolveEffectiveTargets(plan.lock);
  const orphans = plan.entries.filter((e) => e.status === 'orphan');
  const orphansToRemoveList = orphans.filter((o) => opts.orphansToRemove.has(o.name));
  const orphansSkipped = orphans
    .filter((o) => !opts.orphansToRemove.has(o.name))
    .map((o) => o.name);

  const bundle = plan.remoteBundle ?? plan.bundle;
  const previousCommit = plan.lock.commit;
  const toRefresh = plan.commitDrift
    ? plan.entries.filter(isLockedEntry)
    : plan.entries.filter((e) => e.status === 'hashDrift');

  if (toRefresh.length > 0 || orphansToRemoveList.length > 0 || opts.installs.length > 0) {
    await ensureTargetSkillsDirs(plan.scope, targets);
  }

  const pending: Array<{
    name: string;
    kind: 'refresh' | InstallItem['role'];
    computedHash: string;
    linkType: 'symlink' | 'copy';
  }> = [];
  const createdDests: string[] = [];
  let failures = 0;

  for (const entry of toRefresh) {
    const sourceDir = skillSourcePath(bundle, entry.name);
    const computedHash = await computeSkillFolderHash(sourceDir);
    const outcome = await materializeAcrossTargets({
      plan,
      targets,
      name: entry.name,
      sourceDir,
      linkType: plan.lock.skills[entry.name]!.linkType,
    });
    if (outcome.failed) failures += 1;
    else pending.push({ name: entry.name, kind: 'refresh', computedHash, linkType: outcome.linkType });
  }

  const defaultLinkType = resolveDefaultLinkType(plan.lock);
  for (const item of opts.installs) {
    const sourceDir = skillSourcePath(bundle, item.name);
    const computedHash = await computeSkillFolderHash(sourceDir);
    const outcome = await materializeAcrossTargets({
      plan,
      targets,
      name: item.name,
      sourceDir,
      linkType: defaultLinkType,
    });
    createdDests.push(...outcome.dests);
    if (outcome.failed) failures += 1;
    else pending.push({ name: item.name, kind: item.role, computedHash, linkType: outcome.linkType });
  }

  // Fail closed: keep prior lock bytes and cache; do not prune. Remove the dirs
  // this apply created so agents never load unlocked skills the lock and check
  // still treat as missing. Refresh partials stay for sync.
  const rollbackCreated = async (): Promise<void> => {
    for (const destDir of createdDests) {
      await rm(destDir, { recursive: true, force: true }).catch(() => {});
    }
  };
  if (failures > 0) {
    await rollbackCreated();
    throw new CliError(`Update failed for ${failures} skill(s).`);
  }

  const orphansRemoved: string[] = [];
  for (const orphan of orphansToRemoveList) {
    removeSkill(plan.lock, orphan.name);
    for (const target of targets) {
      await rm(destDirFor(plan, target, orphan.name), { recursive: true, force: true });
    }
    orphansRemoved.push(orphan.name);
  }

  const updated: string[] = [];
  const newSkillsAdded: string[] = [];
  const dependenciesAdded: string[] = [];
  const added = { refresh: updated, root: newSkillsAdded, dependency: dependenciesAdded };
  for (const upsert of pending) {
    upsertSkill(plan.lock, upsert.name, {
      source: plan.lock.source,
      sourceType: 'github',
      computedHash: upsert.computedHash,
      linkType: upsert.linkType,
    });
    added[upsert.kind].push(upsert.name);
  }

  const shouldSyncLockRoot =
    plan.commitDrift ||
    plan.manifestDrift ||
    updated.length > 0 ||
    orphansRemoved.length > 0 ||
    dependenciesAdded.length > 0;

  if (shouldSyncLockRoot) {
    syncLockRootFromBundle(plan.lock, bundle);
    try {
      await writeLockfile(plan.scope.lockPath, plan.lock);
    } catch (err) {
      await rollbackCreated();
      throw err;
    }
    if (
      plan.commitDrift &&
      plan.remoteCommit &&
      previousCommit &&
      previousCommit !== 'local' &&
      previousCommit !== plan.remoteCommit
    ) {
      await pruneCommitCache(plan.lock.source, previousCommit);
    }
  }

  const installed = new Set([...newSkillsAdded, ...dependenciesAdded]);
  const requiredBy: Record<string, string> = {};
  for (const item of opts.installs) {
    if (item.role === 'dependency' && installed.has(item.name)) requiredBy[item.name] = item.requiredBy;
  }

  return {
    updated,
    contentChanged: contentChangedSkillNames(plan),
    orphansRemoved,
    orphansSkipped,
    dependenciesAdded,
    dependenciesSkipped: skippedNames(plan, 'missingDependency', installed),
    newSkillsAdded,
    newSkillsSkipped: skippedNames(plan, 'newSkill', installed),
    requiredBy,
  };
}

function skippedNames(
  plan: DriftPlan,
  status: 'missingDependency' | 'newSkill',
  installed: ReadonlySet<string>,
): string[] {
  return plan.entries
    .filter((e) => e.status === status && !installed.has(e.name))
    .map((e) => e.name);
}

export function formatUpdateConfirmMessage(plan: DriftPlan, installs: InstallItem[] = []): string {
  const counts = classifyDriftSummary(plan);
  const installing = `install ${installs.length} skill(s)`;
  if (plan.commitDrift && plan.remoteCommit) {
    const short = (sha: string) => (sha.length > 7 ? sha.slice(0, 7) : sha);
    const suffix = installs.length > 0 ? `, ${installing}` : '';
    return `Update to commit ${short(plan.remoteCommit)} (${counts.changedOnRemote} skill(s) changed, ${counts.willRelink} will be relinked${suffix})?`;
  }
  return installs.length > 0 ? `Proceed with update and ${installing}?` : 'Proceed with update?';
}
