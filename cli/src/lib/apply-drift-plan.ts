import { rm } from 'node:fs/promises';
import { confirm, isCancel } from '@clack/prompts';
import type { DriftPlan } from './drift-plan.js';
import { CliCancel } from './errors.js';
import { materializeFromLockEntry } from './install.js';
import { removeSkill, upsertSkill, writeLockfile } from './lockfile.js';
import { ensureAgentsDir } from './scope.js';

export type OrphanPolicy = 'prompt' | 'skip' | 'remove-all';

export interface ApplyDriftResult {
  updated: string[];
  orphansRemoved: string[];
  orphansSkipped: string[];
}

export function planHasWork(plan: DriftPlan, result: ApplyDriftResult): boolean {
  const drifted = plan.entries.filter((e) => e.status === 'hashDrift');
  return (
    drifted.length > 0 ||
    plan.packageDrift ||
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
  const drifted = plan.entries.filter((e) => e.status === 'hashDrift');
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
      console.warn(`Skipping orphan skill "${orphan.name}" (not in bundle).`);
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

  const updated: string[] = [];

  if (drifted.length > 0 || orphansRemoved.length > 0) {
    await ensureAgentsDir(plan.scope);
  }

  for (const entry of drifted) {
    const lockEntry = plan.lock.skills[entry.name]!;
    const linkType = await materializeFromLockEntry({
      sourceDir: entry.sourceDir!,
      destDir: entry.destDir!,
      linkType: lockEntry.linkType,
    });

    upsertSkill(plan.lock, entry.name, {
      source: lockEntry.source,
      sourceType: 'bundled',
      computedHash: entry.bundleHash!,
      linkType,
    });
    updated.push(entry.name);
  }

  const shouldSyncPackage =
    plan.packageDrift || updated.length > 0 || orphansRemoved.length > 0;

  if (shouldSyncPackage) {
    plan.lock.package = {
      name: plan.bundle.packageName,
      version: plan.bundle.packageVersion,
    };
  }

  if (updated.length > 0 || orphansRemoved.length > 0 || shouldSyncPackage) {
    await writeLockfile(plan.scope.lockPath, plan.lock);
  }

  return { updated, orphansRemoved, orphansSkipped };
}
