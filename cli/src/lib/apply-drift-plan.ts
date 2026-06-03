import { rm } from 'node:fs/promises';
import { confirm, isCancel } from '@clack/prompts';
import {
  resolveBundle,
  skillSourcePath,
  type BundleContext,
} from './bundle.js';
import type { DriftPlan } from './drift-plan.js';
import { CliCancel } from './errors.js';
import { computeSkillFolderHash } from './hash.js';
import { materializeFromLockEntry } from './install.js';
import {
  removeSkill,
  syncLockRootFromBundle,
  upsertSkill,
  writeLockfile,
} from './lockfile.js';
import { ensureAgentsDir } from './scope.js';

export type OrphanPolicy = 'prompt' | 'skip' | 'remove-all';

export interface ApplyDriftResult {
  updated: string[];
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
    orphanPolicy: OrphanPolicy;
    isInteractive: boolean;
    autoYes?: boolean;
  },
): Promise<ApplyDriftResult> {
  const orphans = plan.entries.filter((e) => e.status === 'orphan');
  const orphansRemoved: string[] = [];
  const orphansSkipped: string[] = [];

  for (const orphan of orphans) {
    let remove = false;

    if (opts.orphanPolicy === 'remove-all') {
      remove = true;
    } else if (opts.orphanPolicy === 'skip') {
      orphansSkipped.push(orphan.name);
      continue;
    } else if (opts.isInteractive) {
      const ok = await confirm({
        message: `Remove orphan "${orphan.name}" from disk and lockfile?`,
        initialValue: false,
      });
      if (isCancel(ok)) {
        throw new CliCancel();
      }
      remove = ok === true;
    } else {
      console.warn(`Skipping orphan skill "${orphan.name}" (not in remote pack).`);
      orphansSkipped.push(orphan.name);
      continue;
    }

    if (remove) {
      removeSkill(plan.lock, orphan.name);
      await rm(orphan.destDir!, { recursive: true, force: true });
      orphansRemoved.push(orphan.name);
    } else {
      orphansSkipped.push(orphan.name);
    }
  }

  let bundle: BundleContext = plan.bundle;
  if (plan.commitDrift && plan.remoteCommit) {
    bundle = await resolveBundle({
      githubSource: plan.lock.source,
      commit: plan.remoteCommit,
    });
  }

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
  }

  return { updated, orphansRemoved, orphansSkipped };
}
