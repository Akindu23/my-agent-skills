import {
  classifyDriftSummary,
  type DriftPlan,
  type DriftSkillEntry,
} from './drift-plan.js';
import {
  resolveEffectiveTargets,
  resolveTargetSkillsDir,
} from './install-targets.js';
import { renderSummaryHeader } from './summary-header.js';
import { brand } from './theme.js';

export type DriftSummaryMode = 'check' | 'update';

function shortSha(sha: string): string {
  return sha.length > 7 ? sha.slice(0, 7) : sha;
}

function driftRowLabel(entry: DriftSkillEntry, plan: DriftPlan, mode: DriftSummaryMode): string {
  if (entry.status === 'orphan') return 'orphan';
  if (entry.status === 'missingDependency') return mode === 'check' ? 'missing' : 'new';
  if (plan.commitDrift) {
    if (entry.status === 'hashDrift') return 'pin drift';
    if (entry.remoteChanged) return mode === 'check' ? 'changed' : 'update';
    return 'unchanged';
  }
  if (entry.status === 'ok') return 'ok';
  return mode === 'check' ? 'drift' : 'update';
}

export function renderDriftSummary(plan: DriftPlan, opts: { mode: DriftSummaryMode }): string {
  const counts = classifyDriftSummary(plan);

  const rows = plan.entries.map((entry) => {
    const label = driftRowLabel(entry, plan, opts.mode).padEnd(10);
    const dep = entry.dependencyOf ? ` (required by ${entry.dependencyOf})` : '';
    return `  ${label} ${entry.name}${dep}`;
  });

  const remoteLine = plan.commitDrift
    ? opts.mode === 'check'
      ? `${brand('Pack')}: commit drift (lock ${shortSha(plan.lock.commit)} → ${shortSha(plan.remoteCommit ?? '?')})`
      : `${brand('Pack')}: commit drift (will fetch ${shortSha(plan.remoteCommit ?? '?')})`
    : `${brand('Remote')}: pinned at ${shortSha(plan.lock.commit)}`;

  const manifestLine = plan.manifestDrift
    ? opts.mode === 'check'
      ? `${brand('Manifest')}: version drift (lock ${plan.lock.package?.version ?? 'none'} → pack ${plan.bundle.packageVersion})`
      : `${brand('Manifest')}: version drift (will sync lock)`
    : `${brand('Manifest')}: in sync`;

  const destinations = resolveEffectiveTargets(plan.lock)
    .map((t) => resolveTargetSkillsDir(plan.scope, t))
    .join(', ');

  const header = renderSummaryHeader({
    pack: `${plan.bundle.manifest.name} v${plan.bundle.packageVersion}`,
    scope: plan.scope.scope,
    destination: destinations,
    lockPath: plan.scope.lockPath,
    extraLines: [remoteLine, manifestLine],
  });

  const newDepsSuffix = counts.newDependencies > 0 ? `  New deps: ${counts.newDependencies}` : '';

  const countsLine = plan.commitDrift
    ? opts.mode === 'check'
      ? `Skills: changed ${counts.changedOnRemote}  unchanged ${counts.unchangedOnRemote}  pin drift ${counts.pinDrift}  orphans ${counts.orphans}${newDepsSuffix}`
      : `Changed on remote: ${counts.changedOnRemote}   Unchanged: ${counts.unchangedOnRemote}   Pin drift: ${counts.pinDrift}\nWill relink: ${counts.willRelink} skills to new pack commit   Orphans: ${counts.orphans}${newDepsSuffix}`
    : opts.mode === 'check'
      ? `In sync: ${counts.unchangedOnRemote}  Drift: ${counts.changedOnRemote}  Orphans: ${counts.orphans}${newDepsSuffix}`
      : `To refresh: ${counts.changedOnRemote}  Up to date: ${counts.unchangedOnRemote}  Orphans: ${counts.orphans}${newDepsSuffix}`;

  return [
    ...header,
    '',
    countsLine,
    '',
    'Skills:',
    ...rows,
  ].join('\n');
}
