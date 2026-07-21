import { mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { CliError } from './errors.js';
import type { Lockfile } from './lockfile.js';
import type { ScopePaths } from './scope.js';

export type InstallTarget = 'cursor' | 'claude';
export type CliTargetFlag = InstallTarget | 'both';

const TARGET_ORDER: InstallTarget[] = ['claude', 'cursor'];

export function expandCliTarget(flag: CliTargetFlag): InstallTarget[] {
  if (flag === 'both') return ['claude', 'cursor'];
  return [flag];
}

export function parseCliTarget(raw: string): CliTargetFlag {
  if (raw === 'cursor' || raw === 'claude' || raw === 'both') return raw;
  throw new CliError('Invalid --target. Use cursor, claude, or both.');
}

/** Sorted unique atoms; omit/`undefined` ⇒ Cursor-only. */
export function resolveEffectiveTargets(lock: Pick<Lockfile, 'targets'> | null | undefined): InstallTarget[] {
  if (!lock?.targets || lock.targets.length === 0) return ['cursor'];
  return sortUniqueTargets(lock.targets);
}

export function sortUniqueTargets(targets: readonly InstallTarget[]): InstallTarget[] {
  const set = new Set(targets);
  return TARGET_ORDER.filter((t) => set.has(t));
}

/** Lazy omit: Cursor-only → undefined (do not persist). */
export function normalizeTargetsForWrite(
  targets: readonly InstallTarget[],
): InstallTarget[] | undefined {
  const sorted = sortUniqueTargets(targets);
  if (sorted.length === 1 && sorted[0] === 'cursor') return undefined;
  return sorted;
}

export function applyTargetsToLock(lock: Lockfile, targets: readonly InstallTarget[]): void {
  const normalized = normalizeTargetsForWrite(targets);
  if (normalized === undefined) {
    delete lock.targets;
  } else {
    lock.targets = normalized;
  }
}

/** Union prior lock targets with this operation's targets (never drops a recorded target). */
export function mergeLockTargets(
  prior: readonly InstallTarget[],
  requested: readonly InstallTarget[],
): InstallTarget[] {
  return sortUniqueTargets([...prior, ...requested]);
}

export function resolveTargetSkillsDir(scope: ScopePaths, target: InstallTarget): string {
  if (target === 'cursor') return scope.skillsDir;
  if (scope.scope === 'global') {
    return path.join(os.homedir(), '.claude', 'skills');
  }
  return path.join(scope.cwd, '.claude', 'skills');
}

export async function ensureLockParent(scope: ScopePaths): Promise<void> {
  await mkdir(scope.agentsDir, { recursive: true });
}

export async function ensureTargetSkillsDirs(
  scope: ScopePaths,
  targets: readonly InstallTarget[],
): Promise<void> {
  await ensureLockParent(scope);
  for (const target of sortUniqueTargets(targets)) {
    await mkdir(resolveTargetSkillsDir(scope, target), { recursive: true });
  }
}

export function validateLockTargets(raw: unknown): InstallTarget[] {
  if (!Array.isArray(raw)) {
    throw new CliError('Invalid lockfile: targets must be an array of "cursor" and/or "claude".');
  }
  if (raw.length === 0) {
    throw new CliError('Invalid lockfile: targets must be a non-empty array of "cursor" and/or "claude".');
  }
  const seen = new Set<string>();
  for (const item of raw) {
    if (item !== 'cursor' && item !== 'claude') {
      throw new CliError(
        `Invalid lockfile: targets entry ${JSON.stringify(item)} is not "cursor" or "claude".`,
      );
    }
    if (seen.has(item)) {
      throw new CliError('Invalid lockfile: targets must be unique.');
    }
    seen.add(item);
  }
  return sortUniqueTargets(raw as InstallTarget[]);
}
