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
  bundleHash?: string;
  linkType?: 'symlink' | 'copy';
  sourceDir?: string;
  destDir?: string;
}

export interface DriftPlan {
  bundle: BundleContext;
  scope: ScopePaths;
  lock: Lockfile;
  commitDrift: boolean;
  remoteCommit?: string;
  manifestDrift: boolean;
  entries: DriftSkillEntry[];
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

  if (!usingLocal) {
    const head = await resolveDefaultBranchHead(lock.source);
    remoteCommit = head.commit;
    commitDrift = !lock.commit || lock.commit !== head.commit;
  }

  const manifestDrift = lock.package?.version !== bundle.packageVersion;
  const bundleNames = new Set(skillNamesFromManifest(bundle.manifest));
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
    commitDrift,
    remoteCommit,
    manifestDrift,
    entries,
  };
}

export interface DriftReport {
  jsonPayload: {
    inSync: boolean;
    scope: string;
    lockPath: string;
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
    }>;
  };
  hasDrift: boolean;
}

export function buildDriftReport(plan: DriftPlan): DriftReport {
  const hasSkillDrift = plan.entries.some(
    (e) => e.status === 'hashDrift' || e.status === 'orphan',
  );
  const hasDrift = hasSkillDrift || plan.commitDrift || plan.manifestDrift;

  return {
    jsonPayload: {
      inSync: !hasDrift,
      scope: plan.scope.scope,
      lockPath: plan.scope.lockPath,
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
      })),
    },
    hasDrift,
  };
}
