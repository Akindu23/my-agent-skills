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
  ensureTargetSkillsDirs,
  resolveEffectiveTargets,
  resolveTargetSkillsDir,
} from './install-targets.js';
import {
  removeSkill,
  syncLockRootFromBundle,
  upsertSkill,
  writeLockfile,
} from './lockfile.js';
import { pruneCommitCache } from './remote-pack.js';
import { resolveSkillDestDir } from './skill-paths.js';
import { CliError } from './errors.js';

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
  const targets = resolveEffectiveTargets(plan.lock);
  const orphans = plan.entries.filter((e) => e.status === 'orphan');
  const orphansSkipped: string[] = [];
  const orphansToRemoveList = orphans.filter((o) => opts.orphansToRemove.has(o.name));
  for (const orphan of orphans) {
    if (!opts.orphansToRemove.has(orphan.name)) {
      orphansSkipped.push(orphan.name);
    }
  }

  const bundle = plan.remoteBundle ?? plan.bundle;
  const previousCommit = plan.lock.commit;

  const toRefresh = plan.commitDrift
    ? plan.entries.filter((e) => e.status !== 'orphan')
    : plan.entries.filter((e) => e.status === 'hashDrift');

  const failed: Array<{ name: string; target: string; error: string }> = [];
  const pendingUpserts: Array<{
    name: string;
    computedHash: string;
    linkType: 'symlink' | 'copy';
  }> = [];

  if (toRefresh.length > 0 || orphansToRemoveList.length > 0) {
    await ensureTargetSkillsDirs(plan.scope, targets);
  }

  for (const entry of toRefresh) {
    const lockEntry = plan.lock.skills[entry.name]!;
    const sourceDir = skillSourcePath(bundle, entry.name);
    const bundleHash = await computeSkillFolderHash(sourceDir);
    let lastLinkType = lockEntry.linkType;
    let skillFailed = false;

    for (const target of targets) {
      const destDir = resolveSkillDestDir(
        resolveTargetSkillsDir(plan.scope, target),
        entry.name,
      );
      try {
        lastLinkType = await materializeFromLockEntry({
          sourceDir,
          destDir,
          linkType: lockEntry.linkType,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        failed.push({ name: entry.name, target, error: message });
        skillFailed = true;
      }
    }

    if (!skillFailed) {
      pendingUpserts.push({
        name: entry.name,
        computedHash: bundleHash,
        linkType: lastLinkType,
      });
    }
  }

  // Fail closed: keep prior lock bytes and cache; do not prune. Partial dest
  // updates may remain on disk for sync to repair against the unchanged pin.
  if (failed.length > 0) {
    throw new CliError(`Update failed for ${failed.length} skill target(s).`);
  }

  const orphansRemoved: string[] = [];
  for (const orphan of orphansToRemoveList) {
    removeSkill(plan.lock, orphan.name);
    for (const target of targets) {
      const destDir = resolveSkillDestDir(
        resolveTargetSkillsDir(plan.scope, target),
        orphan.name,
      );
      await rm(destDir, { recursive: true, force: true });
    }
    orphansRemoved.push(orphan.name);
  }

  const updated: string[] = [];
  for (const upsert of pendingUpserts) {
    upsertSkill(plan.lock, upsert.name, {
      source: plan.lock.source,
      sourceType: 'github',
      computedHash: upsert.computedHash,
      linkType: upsert.linkType,
    });
    updated.push(upsert.name);
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

  return {
    updated,
    contentChanged: contentChangedSkillNames(plan),
    orphansRemoved,
    orphansSkipped,
  };
}

export function formatUpdateConfirmMessage(plan: DriftPlan): string {
  const counts = classifyDriftSummary(plan);
  if (plan.commitDrift && plan.remoteCommit) {
    const short = (sha: string) => (sha.length > 7 ? sha.slice(0, 7) : sha);
    return `Update to commit ${short(plan.remoteCommit)} (${counts.changedOnRemote} skill(s) changed, ${counts.willRelink} will be relinked)?`;
  }
  return 'Proceed with update?';
}
