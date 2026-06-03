import { rm } from 'node:fs/promises';
import { materializeSkill } from './install.js';
import type { InstallPlan, InstallPlanEntry } from './install-plan.js';
import {
  syncLockRootFromBundle,
  upsertSkill,
  writeLockfile,
} from './lockfile.js';
import { ensureAgentsDir } from './scope.js';

export interface ApplyInstallPlanResult {
  installed: string[];
  reinstalled: string[];
  skipped: string[];
  installedEntries: InstallPlanEntry[];
  skippedEntries: InstallPlanEntry[];
}

export async function applyInstallPlan(
  plan: InstallPlan,
  opts: { copy?: boolean },
): Promise<ApplyInstallPlanResult> {
  const installed: string[] = [];
  const reinstalled: string[] = [];
  const skipped: string[] = [];
  const installedEntries: InstallPlanEntry[] = [];
  const skippedEntries: InstallPlanEntry[] = [];
  const materializedThisRun: string[] = [];

  await ensureAgentsDir(plan.scope);
  const lockBefore = structuredClone(plan.lock);

  try {
    syncLockRootFromBundle(plan.lock, plan.bundle);

    for (const entry of plan.entries) {
      if (entry.action === 'skip') {
        skipped.push(entry.name);
        skippedEntries.push(entry);
        continue;
      }

      const linkType = await materializeSkill({
        sourceDir: entry.sourceDir,
        destDir: entry.destDir,
        copy: opts.copy ?? entry.linkType === 'copy',
      });
      materializedThisRun.push(entry.name);

      upsertSkill(plan.lock, entry.name, {
        source: plan.bundle.githubSource,
        sourceType: 'github',
        computedHash: entry.computedHash,
        linkType,
      });

      if (entry.action === 'confirm') {
        reinstalled.push(entry.name);
      } else {
        installed.push(entry.name);
      }
      installedEntries.push({ ...entry, linkType });
    }

    await writeLockfile(plan.scope.lockPath, plan.lock);
  } catch (err) {
    plan.lock = lockBefore;
    for (const name of materializedThisRun) {
      const entry = plan.entries.find((e) => e.name === name);
      if (entry) {
        await rm(entry.destDir, { recursive: true, force: true }).catch(() => {});
      }
    }
    throw err;
  }

  return { installed, reinstalled, skipped, installedEntries, skippedEntries };
}
