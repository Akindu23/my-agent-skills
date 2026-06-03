import type { DriftPlan } from './drift-plan.js';
import { renderSummaryHeader } from './summary-header.js';
import { brand } from './theme.js';

export type DriftSummaryMode = 'check' | 'update';

function driftStatusLabel(
  status: DriftPlan['entries'][number]['status'],
  mode: DriftSummaryMode,
): string {
  if (status === 'ok') return 'ok';
  if (status === 'hashDrift') return mode === 'check' ? 'drift' : 'update';
  return 'orphan';
}

function shortSha(sha: string): string {
  return sha.length > 7 ? sha.slice(0, 7) : sha;
}

export function renderDriftSummary(plan: DriftPlan, opts: { mode: DriftSummaryMode }): string {
  const drifted = plan.entries.filter((e) => e.status === 'hashDrift');
  const orphans = plan.entries.filter((e) => e.status === 'orphan');
  const ok = plan.entries.filter((e) => e.status === 'ok');

  const rows = plan.entries.map((entry) => {
    const label = driftStatusLabel(entry.status, opts.mode).padEnd(8);
    return `  ${label} ${entry.name}`;
  });

  const remoteLine = plan.commitDrift
    ? opts.mode === 'check'
      ? `${brand('Remote')}: commit drift (lock ${shortSha(plan.lock.commit)} → ${shortSha(plan.remoteCommit ?? '?')})`
      : `${brand('Remote')}: commit drift (will fetch ${shortSha(plan.remoteCommit ?? '?')})`
    : `${brand('Remote')}: pinned at ${shortSha(plan.lock.commit)}`;

  const manifestLine = plan.manifestDrift
    ? opts.mode === 'check'
      ? `${brand('Manifest')}: version drift (lock ${plan.lock.package?.version ?? 'none'} → pack ${plan.bundle.packageVersion})`
      : `${brand('Manifest')}: version drift (will sync lock)`
    : `${brand('Manifest')}: in sync`;

  const header = renderSummaryHeader({
    pack: `${plan.bundle.manifest.name} v${plan.bundle.packageVersion}`,
    scope: plan.scope.scope,
    destination: plan.scope.skillsDir,
    lockPath: plan.scope.lockPath,
    extraLines: [remoteLine, manifestLine],
  });

  const countsLine =
    opts.mode === 'check'
      ? `In sync: ${ok.length}  Drift: ${drifted.length}  Orphans: ${orphans.length}`
      : `To refresh: ${drifted.length + (plan.commitDrift ? ok.length : 0)}  Up to date: ${plan.commitDrift ? 0 : ok.length}  Orphans: ${orphans.length}`;

  return [
    ...header,
    '',
    countsLine,
    '',
    'Skills:',
    ...rows,
  ].join('\n');
}
