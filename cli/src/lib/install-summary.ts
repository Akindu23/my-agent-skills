import type { InstallPlan } from './install-plan.js';
import { resolveTargetSkillsDir } from './install-targets.js';
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
  const multiTarget = plan.targets.length > 1;
  const rows = plan.entries.map((entry) => {
    const dep = entry.dependencyOf ? muted(` (dependency of ${entry.dependencyOf})`) : '';
    const target = multiTarget ? muted(` [${entry.target}]`) : '';
    return `  ${installActionLabel(entry.action).padEnd(8)} ${entry.name}${target}${dep}`;
  });

  const destinations = plan.targets
    .map((t) => resolveTargetSkillsDir(plan.scope, t))
    .join(', ');

  const header = renderSummaryHeader({
    pack: `${plan.bundle.manifest.name} v${plan.bundle.packageVersion}`,
    scope: plan.scope.scope,
    destination: destinations,
    extraLines: [
      `${brand('Mode')}: ${plan.linkType}`,
      ...(multiTarget ? [`${brand('Targets')}: ${plan.targets.join(', ')}`] : []),
      ...formatSelectedLines(plan),
    ],
  });

  const footer =
    confirmCount > 0
      ? muted(
          `\nBundle content changed for ${confirmCount} skill(s); reinstall overwrites on-disk copies.`,
        )
      : '';

  return [...header, '', 'Skills:', ...rows, footer].join('\n');
}
