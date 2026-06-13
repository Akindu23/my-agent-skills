import { rm } from 'node:fs/promises';
import { skillSourcePath } from './bundle.js';
import {
  classifyDriftSummary,
  contentChangedSkillNames,
  type DriftPlan,
} from './drift-plan.js';
import { computeSkillFolderHash } from './hash.js';
import { materializeFromLockEntry } from './install.js';
import {
  removeSkill,
  syncLockRootFromBundle,
  upsertSkill,
  writeLockfile,
} from './lockfile.js';
import { pruneRepoCache } from './remote-pack.js';
import { ensureAgentsDir } from './scope.js';

export interface ApplyDriftResult {
  updated: string[];
  contentChanged: string[];
  orphansRemoved: string[];
  orphansSkipped: string[];
}

export function planHasWork(plan: DriftPlan, result: ApplyDriftResult): boolean {
  const refreshable = plan.entries.filter((e) => e.status !== 'orphan');
  const needsRefresh =
    plan.commitDrift ||
    refreshable.some((e) => e.status === 'hashDrift');
  return (
    needsRefresh ||
    plan.manifestDrift ||
    result.orphansRemoved.length > 0
  );
}

export async function applyDriftPlan(
  plan: DriftPlan,
  opts: {
    orphansToRemove: ReadonlySet<string>;
  },
): Promise<ApplyDriftResult> {
  const orphans = plan.entries.filter((e) => e.status === 'orphan');
  const orphansRemoved: string[] = [];
  const orphansSkipped: string[] = [];

  for (const orphan of orphans) {
    if (!opts.orphansToRemove.has(orphan.name)) {
      orphansSkipped.push(orphan.name);
      continue;
    }

    removeSkill(plan.lock, orphan.name);
    await rm(orphan.destDir!, { recursive: true, force: true });
    orphansRemoved.push(orphan.name);
  }

  const bundle = plan.remoteBundle ?? plan.bundle;

  const toRefresh = plan.commitDrift
    ? plan.entries.filter((e) => e.status !== 'orphan')
    : plan.entries.filter((e) => e.status === 'hashDrift');

  const updated: string[] = [];

  if (toRefresh.length > 0 || orphansRemoved.length > 0) {
    await ensureAgentsDir(plan.scope);
  }

  for (const entry of toRefresh) {
    const lockEntry = plan.lock.skills[entry.name]!;
    const sourceDir = skillSourcePath(bundle, entry.name);
    const bundleHash = await computeSkillFolderHash(sourceDir);

    const linkType = await materializeFromLockEntry({
      sourceDir,
      destDir: entry.destDir!,
      linkType: lockEntry.linkType,
    });

    upsertSkill(plan.lock, entry.name, {
      source: plan.lock.source,
      sourceType: 'github',
      computedHash: bundleHash,
      linkType,
    });
    updated.push(entry.name);
  }

  const shouldSyncLockRoot =
    plan.commitDrift ||
    plan.manifestDrift ||
    updated.length > 0 ||
    orphansRemoved.length > 0;

  if (shouldSyncLockRoot) {
    syncLockRootFromBundle(plan.lock, bundle);
  }

  if (updated.length > 0 || orphansRemoved.length > 0 || shouldSyncLockRoot) {
    await writeLockfile(plan.scope.lockPath, plan.lock);
    if (plan.commitDrift && plan.remoteCommit) {
      await pruneRepoCache(plan.lock.source, plan.remoteCommit);
    }
  }

  const contentChanged = contentChangedSkillNames(plan);

  return { updated, contentChanged, orphansRemoved, orphansSkipped };
}

export function formatUpdateConfirmMessage(plan: DriftPlan): string {
  const counts = classifyDriftSummary(plan);
  if (plan.commitDrift && plan.remoteCommit) {
    const short = (sha: string) => (sha.length > 7 ? sha.slice(0, 7) : sha);
    return `Update to commit ${short(plan.remoteCommit)} (${counts.changedOnRemote} skill(s) changed, ${counts.willRelink} will be relinked)?`;
  }
  return 'Proceed with update?';
}
