import { rm } from 'node:fs/promises';
import { materializeSkill } from './install.js';
import type { InstallPlan, InstallPlanEntry } from './install-plan.js';
import {
  applyTargetsToLock,
  ensureTargetSkillsDirs,
  mergeLockTargets,
  resolveEffectiveTargets,
} from './install-targets.js';
import {
  syncLockRootFromBundle,
  upsertSkill,
  writeLockfile,
} from './lockfile.js';

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
  const installedEntries: InstallPlanEntry[] = [];
  const skippedEntries: InstallPlanEntry[] = [];
  const materializedDests: string[] = [];

  await ensureTargetSkillsDirs(plan.scope, plan.targets);
  const lockBefore = structuredClone(plan.lock);

  try {
    syncLockRootFromBundle(plan.lock, plan.bundle);
    const priorHadSkills = Object.keys(lockBefore.skills).length > 0;
    const lockTargets = priorHadSkills
      ? mergeLockTargets(resolveEffectiveTargets(lockBefore), plan.targets)
      : plan.targets;
    applyTargetsToLock(plan.lock, lockTargets);

    for (const entry of plan.entries) {
      if (entry.action === 'skip') {
        skippedEntries.push(entry);
        continue;
      }

      const linkType = await materializeSkill({
        sourceDir: entry.sourceDir,
        destDir: entry.destDir,
        copy: opts.copy ?? entry.linkType === 'copy',
      });
      materializedDests.push(entry.destDir);

      upsertSkill(plan.lock, entry.name, {
        source: plan.bundle.githubSource,
        sourceType: 'github',
        computedHash: entry.computedHash,
        linkType,
      });

      installedEntries.push({ ...entry, linkType });
    }

    await writeLockfile(plan.scope.lockPath, plan.lock);
  } catch (err) {
    plan.lock = lockBefore;
    for (const destDir of materializedDests) {
      await rm(destDir, { recursive: true, force: true }).catch(() => {});
    }
    throw err;
  }

  const byName = new Map<string, InstallPlanEntry[]>();
  for (const entry of plan.entries) {
    const list = byName.get(entry.name) ?? [];
    list.push(entry);
    byName.set(entry.name, list);
  }

  const installed: string[] = [];
  const reinstalled: string[] = [];
  const skipped: string[] = [];

  for (const [name, entries] of byName) {
    const nonSkip = entries.filter((e) => e.action !== 'skip');
    if (nonSkip.length === 0) {
      skipped.push(name);
      continue;
    }
    if (nonSkip.some((e) => e.action === 'confirm')) {
      reinstalled.push(name);
    } else {
      installed.push(name);
    }
  }

  return { installed, reinstalled, skipped, installedEntries, skippedEntries };
}
