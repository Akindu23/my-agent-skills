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

export function renderDriftSummary(plan: DriftPlan, opts: { mode: DriftSummaryMode }): string {
  const drifted = plan.entries.filter((e) => e.status === 'hashDrift');
  const orphans = plan.entries.filter((e) => e.status === 'orphan');
  const ok = plan.entries.filter((e) => e.status === 'ok');

  const rows = plan.entries.map((entry) => {
    const label = driftStatusLabel(entry.status, opts.mode).padEnd(8);
    return `  ${label} ${entry.name}`;
  });

  const packageLine =
    plan.packageDrift
      ? opts.mode === 'check'
        ? `${brand('Package')}: version drift (lock ${plan.lock.package?.version ?? 'none'} → bundle ${plan.bundle.packageVersion})`
        : `${brand('Package')}: version drift (will sync lock)`
      : `${brand('Package')}: in sync`;

  const header = renderSummaryHeader({
    pack: `${plan.bundle.manifest.name} v${plan.bundle.packageVersion}`,
    scope: plan.scope.scope,
    destination: plan.scope.skillsDir,
    lockPath: plan.scope.lockPath,
    extraLines: [packageLine],
  });

  const countsLine =
    opts.mode === 'check'
      ? `In sync: ${ok.length}  Drift: ${drifted.length}  Orphans: ${orphans.length}`
      : `To refresh: ${drifted.length}  Up to date: ${ok.length}  Orphans: ${orphans.length}`;

  return [
    ...header,
    '',
    countsLine,
    '',
    'Skills:',
    ...rows,
  ].join('\n');
}
