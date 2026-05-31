import type { ScopePaths } from './scope.js';
import { renderSummaryHeader } from './summary-header.js';

function truncateName(name: string, max: number): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

export function renderRemoveSummary(opts: {
  scope: ScopePaths;
  removed: string[];
}): string {
  const header = renderSummaryHeader({
    scope: opts.scope.scope,
    destination: opts.scope.skillsDir,
    lockPath: opts.scope.lockPath,
  });

  const names = [...opts.removed].sort();
  const tableRows = names.map((name) => {
    const status = 'removed'.padEnd(8);
    const label = truncateName(name, 28).padEnd(28);
    return `  ${status} ${label}`;
  });

  return [
    ...header,
    '',
    `Removed: ${names.length}`,
    '',
    `  ${'STATUS'.padEnd(8)} ${'NAME'.padEnd(28)}`,
    ...tableRows,
  ].join('\n');
}
