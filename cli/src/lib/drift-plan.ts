import {
  isLocalOverride,
  resolveBundle,
  skillNamesFromManifest,
  skillSourcePath,
  type BundleContext,
} from './bundle.js';
import { computeSkillFolderHash } from './hash.js';
import { readLockfile, type Lockfile } from './lockfile.js';
import { resolveDefaultBranchHead } from './remote-pack.js';
import { resolveSkillDestDir } from './skill-paths.js';
import type { ScopePaths } from './scope.js';

export type DriftStatus = 'ok' | 'hashDrift' | 'orphan';

export interface DriftSkillEntry {
  name: string;
  status: DriftStatus;
  lockHash?: string;
  /** Hash at the lock's pinned commit. */
  bundleHash?: string;
  /** Hash at remote default-branch commit when commit drift. */
  remoteHash?: string;
  /** Lock hash differs from content at remoteCommit. */
  remoteChanged?: boolean;
  linkType?: 'symlink' | 'copy';
  sourceDir?: string;
  destDir?: string;
}

export interface DriftPlan {
  bundle: BundleContext;
  remoteBundle?: BundleContext;
  scope: ScopePaths;
  lock: Lockfile;
  commitDrift: boolean;
  remoteCommit?: string;
  manifestDrift: boolean;
  entries: DriftSkillEntry[];
}

export interface DriftSummaryCounts {
  changedOnRemote: number;
  unchangedOnRemote: number;
  pinDrift: number;
  orphans: number;
  willRelink: number;
}

export function classifyDriftSummary(plan: DriftPlan): DriftSummaryCounts {
  const orphans = plan.entries.filter((e) => e.status === 'orphan').length;
  const nonOrphans = plan.entries.filter((e) => e.status !== 'orphan');
  const pinDrift = plan.entries.filter((e) => e.status === 'hashDrift').length;

  if (plan.commitDrift) {
    const changedOnRemote = nonOrphans.filter(
      (e) => e.status === 'hashDrift' || e.remoteChanged === true,
    ).length;
    const unchangedOnRemote = nonOrphans.filter(
      (e) => e.status === 'ok' && !e.remoteChanged,
    ).length;
    return {
      changedOnRemote,
      unchangedOnRemote,
      pinDrift,
      orphans,
      willRelink: nonOrphans.length,
    };
  }

  const drifted = plan.entries.filter((e) => e.status === 'hashDrift').length;
  const ok = plan.entries.filter((e) => e.status === 'ok').length;
  return {
    changedOnRemote: drifted,
    unchangedOnRemote: ok,
    pinDrift: drifted,
    orphans,
    willRelink: drifted,
  };
}

export function contentChangedSkillNames(plan: DriftPlan): string[] {
  return plan.entries
    .filter(
      (e) =>
        e.status !== 'orphan' &&
        (e.status === 'hashDrift' || e.remoteChanged === true),
    )
    .map((e) => e.name);
}

export async function planDriftFromBundles(opts: {
  scope: ScopePaths;
  lock: Lockfile;
  bundle: BundleContext;
  remoteBundle?: BundleContext;
  commitDrift: boolean;
  remoteCommit?: string;
}): Promise<DriftPlan> {
  const manifestBundle =
    opts.commitDrift && opts.remoteBundle ? opts.remoteBundle : opts.bundle;
  const manifestDrift = lockPackageVersion(opts.lock) !== manifestBundle.packageVersion;
  const manifestNames = new Set(skillNamesFromManifest(manifestBundle.manifest));
  const entries: DriftSkillEntry[] = [];

  for (const name of Object.keys(opts.lock.skills).sort()) {
    const lockEntry = opts.lock.skills[name]!;
    const destDir = resolveSkillDestDir(opts.scope.skillsDir, name);

    if (!manifestNames.has(name)) {
      entries.push({ name, status: 'orphan', linkType: lockEntry.linkType, destDir });
      continue;
    }

    const pinSourceDir = skillSourcePath(opts.bundle, name);
    const bundleHash = await computeSkillFolderHash(pinSourceDir);
    const status: DriftStatus =
      lockEntry.computedHash === bundleHash ? 'ok' : 'hashDrift';

    let remoteHash: string | undefined;
    let remoteChanged: boolean | undefined;
    if (opts.commitDrift && opts.remoteBundle) {
      const remoteSourceDir = skillSourcePath(opts.remoteBundle, name);
      remoteHash = await computeSkillFolderHash(remoteSourceDir);
      remoteChanged = lockEntry.computedHash !== remoteHash;
    }

    entries.push({
      name,
      status,
      lockHash: lockEntry.computedHash,
      bundleHash,
      remoteHash,
      remoteChanged,
      linkType: lockEntry.linkType,
      sourceDir: pinSourceDir,
      destDir,
    });
  }

  return {
    bundle: opts.bundle,
    remoteBundle: opts.remoteBundle,
    scope: opts.scope,
    lock: opts.lock,
    commitDrift: opts.commitDrift,
    remoteCommit: opts.remoteCommit,
    manifestDrift,
    entries,
  };
}

function lockPackageVersion(lock: Lockfile): string | null {
  return lock.package?.version ?? null;
}

export async function createDriftPlan(opts: {
  scope: ScopePaths;
  source?: string;
  bundle?: BundleContext;
}): Promise<DriftPlan> {
  const lock = await readLockfile(opts.scope.lockPath);
  if (!lock || Object.keys(lock.skills).length === 0) {
    const { CliError } = await import('./errors.js');
    throw new CliError(
      `No lockfile or empty skills at ${opts.scope.lockPath}. Run add first.\n\nExample:\n  cursor-agent-skills add --skill caveman -p -y`,
    );
  }

  const bundle =
    opts.bundle ??
    (await resolveBundle({
      source: opts.source,
      githubSource: lock.source,
      commit: lock.commit || undefined,
    }));

  const usingLocal = isLocalOverride({ source: opts.source }) || bundle.commit === 'local';

  let commitDrift = false;
  let remoteCommit: string | undefined;
  let remoteBundle: BundleContext | undefined;

  if (!usingLocal) {
    const head = await resolveDefaultBranchHead(lock.source);
    remoteCommit = head.commit;
    commitDrift = !lock.commit || lock.commit !== head.commit;
    if (commitDrift && remoteCommit) {
      remoteBundle = await resolveBundle({
        source: opts.source,
        githubSource: lock.source,
        commit: remoteCommit,
      });
    }
  }

  return planDriftFromBundles({
    scope: opts.scope,
    lock,
    bundle,
    remoteBundle,
    commitDrift,
    remoteCommit,
  });
}

export interface DriftReport {
  jsonPayload: {
    inSync: boolean;
    scope: string;
    lockPath: string;
    summary: DriftSummaryCounts;
    remote: {
      source: string;
      lockCommit: string;
      remoteCommit: string | null;
      commitDrift: boolean;
    };
    package: {
      name: string;
      lockVersion: string | null;
      bundleVersion: string;
      manifestDrift: boolean;
    };
    skills: Array<{
      name: string;
      status: DriftStatus;
      linkType?: 'symlink' | 'copy';
      remote: { changed: boolean | null };
    }>;
  };
  hasDrift: boolean;
}

export function buildDriftReport(plan: DriftPlan): DriftReport {
  const hasSkillDrift = plan.entries.some(
    (e) => e.status === 'hashDrift' || e.status === 'orphan' || e.remoteChanged === true,
  );
  const hasDrift = hasSkillDrift || plan.commitDrift || plan.manifestDrift;
  const summary = classifyDriftSummary(plan);

  return {
    jsonPayload: {
      inSync: !hasDrift,
      scope: plan.scope.scope,
      lockPath: plan.scope.lockPath,
      summary,
      remote: {
        source: plan.lock.source,
        lockCommit: plan.lock.commit,
        remoteCommit: plan.remoteCommit ?? null,
        commitDrift: plan.commitDrift,
      },
      package: {
        name: plan.bundle.packageName,
        lockVersion: plan.lock.package?.version ?? null,
        bundleVersion: plan.bundle.packageVersion,
        manifestDrift: plan.manifestDrift,
      },
      skills: plan.entries.map((e) => ({
        name: e.name,
        status: e.status,
        ...(e.linkType ? { linkType: e.linkType } : {}),
        remote: {
          changed: plan.commitDrift ? (e.remoteChanged ?? null) : null,
        },
      })),
    },
    hasDrift,
  };
}
