import type { BundleContext } from './bundle.js';
import type { ScopePaths } from './scope.js';
import { depsLabelForSkill } from './sync-summary.js';
import { renderSummaryHeader } from './summary-header.js';

export type ListHealthStatus = 'ok' | 'broken' | 'missing';

export interface ListSummaryRow {
  name: string;
  status: ListHealthStatus;
  linkType: string;
  hashPrefix: string;
  deps: string;
}

function truncateName(name: string, max: number): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

export function renderListSummary(opts: {
  scope: ScopePaths;
  bundle?: BundleContext;
  rows: ListSummaryRow[];
}): string {
  const packLine = opts.bundle
    ? `${opts.bundle.manifest.name} v${opts.bundle.packageVersion}`
    : undefined;

  const header = renderSummaryHeader({
    pack: packLine,
    scope: opts.scope.scope,
    destination: opts.scope.skillsDir,
    lockPath: opts.scope.lockPath,
  });

  const tableRows = opts.rows.map((row) => {
    const status = row.status.padEnd(8);
    const name = truncateName(row.name, 28).padEnd(28);
    const link = row.linkType.padEnd(8);
    const hash = row.hashPrefix.padEnd(8);
    const deps = truncateName(row.deps, 24).padEnd(24);
    return `  ${status} ${name} ${link} ${hash} ${deps}`;
  });

  return [
    ...header,
    '',
    `  ${'STATUS'.padEnd(8)} ${'NAME'.padEnd(28)} ${'LINK'.padEnd(8)} ${'HASH'.padEnd(8)} ${'DEPS'.padEnd(24)}`,
    ...tableRows,
  ].join('\n');
}

export function buildListSummaryRows(
  rows: Array<{
    name: string;
    linkType: string;
    hashPrefix: string;
    exists: boolean;
    healthy: boolean;
  }>,
  bundle?: BundleContext,
): ListSummaryRow[] {
  return rows.map((row) => {
    const status: ListHealthStatus = row.healthy
      ? 'ok'
      : row.exists
        ? 'broken'
        : 'missing';
    return {
      name: row.name,
      status,
      linkType: row.linkType,
      hashPrefix: row.hashPrefix,
      deps: depsLabelForSkill(bundle, row.name),
    };
  });
}
