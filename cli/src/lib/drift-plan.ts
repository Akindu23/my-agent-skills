import {
  resolveBundle,
  skillNamesFromManifest,
  skillSourcePath,
  type BundleContext,
} from './bundle.js';
import { computeSkillFolderHash } from './hash.js';
import { readLockfile, type Lockfile } from './lockfile.js';
import { resolveSkillDestDir } from './skill-paths.js';
import type { ScopePaths } from './scope.js';

export type DriftStatus = 'ok' | 'hashDrift' | 'orphan';

export interface DriftSkillEntry {
  name: string;
  status: DriftStatus;
  lockHash?: string;
  bundleHash?: string;
  linkType?: 'symlink' | 'copy';
  sourceDir?: string;
  destDir?: string;
}

export interface DriftPlan {
  bundle: BundleContext;
  scope: ScopePaths;
  lock: Lockfile;
  packageDrift: boolean;
  entries: DriftSkillEntry[];
}

export async function createDriftPlan(opts: {
  scope: ScopePaths;
  source?: string;
  bundle?: BundleContext;
}): Promise<DriftPlan> {
  const bundle = opts.bundle ?? (await resolveBundle({ source: opts.source }));
  const lock = await readLockfile(opts.scope.lockPath);
  if (!lock || Object.keys(lock.skills).length === 0) {
    const { CliError } = await import('./errors.js');
    throw new CliError(
      `No lockfile or empty skills at ${opts.scope.lockPath}. Run add first.\n\nExample:\n  cursor-agent-skills add --skill caveman -p -y`,
    );
  }

  const bundleNames = new Set(skillNamesFromManifest(bundle.manifest));
  const packageDrift =
    lock.package?.version !== bundle.packageVersion;

  const entries: DriftSkillEntry[] = [];

  for (const name of Object.keys(lock.skills).sort()) {
    const lockEntry = lock.skills[name]!;
    const destDir = resolveSkillDestDir(opts.scope.skillsDir, name);

    if (!bundleNames.has(name)) {
      entries.push({ name, status: 'orphan', linkType: lockEntry.linkType, destDir });
      continue;
    }

    const sourceDir = skillSourcePath(bundle, name);
    const bundleHash = await computeSkillFolderHash(sourceDir);
    const status: DriftStatus =
      lockEntry.computedHash === bundleHash ? 'ok' : 'hashDrift';

    entries.push({
      name,
      status,
      lockHash: lockEntry.computedHash,
      bundleHash,
      linkType: lockEntry.linkType,
      sourceDir,
      destDir,
    });
  }

  return {
    bundle,
    scope: opts.scope,
    lock,
    packageDrift,
    entries,
  };
}

export interface DriftReport {
  jsonPayload: {
    inSync: boolean;
    scope: string;
    lockPath: string;
    package: {
      name: string;
      lockVersion: string | null;
      bundleVersion: string;
      drift: boolean;
    };
    skills: Array<{
      name: string;
      status: DriftStatus;
      linkType?: 'symlink' | 'copy';
    }>;
  };
  hasDrift: boolean;
}

export function buildDriftReport(plan: DriftPlan): DriftReport {
  const hasSkillDrift = plan.entries.some(
    (e) => e.status === 'hashDrift' || e.status === 'orphan',
  );
  const hasDrift = hasSkillDrift || plan.packageDrift;

  return {
    jsonPayload: {
      inSync: !hasDrift,
      scope: plan.scope.scope,
      lockPath: plan.scope.lockPath,
      package: {
        name: plan.bundle.packageName,
        lockVersion: plan.lock.package?.version ?? null,
        bundleVersion: plan.bundle.packageVersion,
        drift: plan.packageDrift,
      },
      skills: plan.entries.map((e) => ({
        name: e.name,
        status: e.status,
        ...(e.linkType ? { linkType: e.linkType } : {}),
      })),
    },
    hasDrift,
  };
}
