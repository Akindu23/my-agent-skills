import type { InstallPlan } from './install-plan.js';
import { renderSummaryHeader } from './summary-header.js';
import { brand, muted } from './theme.js';

/** Comma-separated Selected line; above this, one skill name per line (keeps Clack note box narrow). */
const SELECTED_INLINE_MAX = 5;

function installActionLabel(action: InstallPlan['entries'][number]['action']): string {
  return action === 'confirm' ? 'reinstall' : action;
}

function formatSelectedLines(plan: InstallPlan): string[] {
  const dependencyText =
    plan.dependencyCount > 0 ? ` (+${plan.dependencyCount} dependencies)` : '';
  const { selected } = plan;

  if (selected.length <= SELECTED_INLINE_MAX) {
    return [`${brand('Selected')}: ${selected.join(', ')}${dependencyText}`];
  }

  return [
    `${brand('Selected')} (${selected.length})${dependencyText}:`,
    ...selected.map((name) => `  ${name}`),
  ];
}

export function renderInstallSummary(plan: InstallPlan): string {
  const confirmCount = plan.entries.filter((e) => e.action === 'confirm').length;
  const rows = plan.entries.map((entry) => {
    const dep = entry.dependencyOf ? muted(` (dependency of ${entry.dependencyOf})`) : '';
    return `  ${installActionLabel(entry.action).padEnd(8)} ${entry.name}${dep}`;
  });

  const header = renderSummaryHeader({
    pack: `${plan.bundle.manifest.name} v${plan.bundle.packageVersion}`,
    scope: plan.scope.scope,
    destination: plan.scope.skillsDir,
    extraLines: [`${brand('Mode')}: ${plan.linkType}`, ...formatSelectedLines(plan)],
  });

  const footer =
    confirmCount > 0
      ? muted(
          `\nBundle content changed for ${confirmCount} skill(s); reinstall overwrites on-disk copies.`,
        )
      : '';

  return [...header, '', 'Skills:', ...rows, footer].join('\n');
}
