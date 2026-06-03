import type { BundleContext } from './bundle.js';
import type { ScopePaths } from './scope.js';
import { renderSummaryHeader } from './summary-header.js';
export type SyncRowStatus = 'synced' | 'ok';

export interface SyncSummaryRow {
  name: string;
  status: SyncRowStatus;
  deps: string;
}

function truncateName(name: string, max: number): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

export function renderSyncSummary(opts: {
  scope: ScopePaths;
  bundle?: BundleContext;
  rows: SyncSummaryRow[];
}): string {
  const synced = opts.rows.filter((r) => r.status === 'synced').length;
  const ok = opts.rows.filter((r) => r.status === 'ok').length;

  const packLine = opts.bundle
    ? `${opts.bundle.manifest.name} v${opts.bundle.packageVersion}`
    : undefined;

  const header = renderSummaryHeader({
    pack: packLine,
    scope: opts.scope.scope,
    destination: opts.scope.skillsDir,
  });

  const tableRows = opts.rows.map((row) => {
    const status = row.status.padEnd(6);
    const name = truncateName(row.name, 28).padEnd(28);
    const deps = truncateName(row.deps, 24).padEnd(24);
    return `  ${status} ${name} ${deps}`;
  });

  return [
    ...header,
    '',
    `Synced: ${synced}  Up to date: ${ok}`,
    '',
    `  ${'STATUS'.padEnd(6)} ${'NAME'.padEnd(28)} ${'DEPS'.padEnd(24)}`,
    ...tableRows,
  ].join('\n');
}

export function depsLabelForSkill(
  bundle: BundleContext | undefined,
  skillName: string,
): string {
  if (!bundle) return '—';
  const deps = bundle.manifest.dependsOn[skillName];
  if (!deps?.length) return '—';
  return deps.join(', ');
}

export function buildSyncSummaryRows(
  names: string[],
  synced: string[],
  bundle?: BundleContext,
): SyncSummaryRow[] {
  const syncedSet = new Set(synced);
  return names.sort().map((name) => ({
    name,
    status: syncedSet.has(name) ? 'synced' : 'ok',
    deps: depsLabelForSkill(bundle, name),
  }));
}
