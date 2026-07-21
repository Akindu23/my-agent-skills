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

function groupEntriesByName(plan: InstallPlan): InstallPlan['entries'][] {
  const byName = new Map<string, InstallPlan['entries']>();
  for (const entry of plan.entries) {
    const group = byName.get(entry.name);
    if (group) group.push(entry);
    else byName.set(entry.name, [entry]);
  }
  return plan.ordered.map((name) => byName.get(name) ?? []);
}

export function renderInstallSummary(plan: InstallPlan): string {
  const confirmCount = plan.entries.filter((e) => e.action === 'confirm').length;
  const multiTarget = plan.targets.length > 1;

  const rows = groupEntriesByName(plan).map((group) => {
    const [first] = group;
    const dep = first?.dependencyOf ? muted(` (dependency of ${first.dependencyOf})`) : '';

    const allAgree = group.every((entry) => entry.action === first!.action);
    if (!multiTarget || allAgree) {
      return `  ${installActionLabel(first!.action).padEnd(12)} ${first!.name}${dep}`;
    }

    const perTarget = group
      .map((entry) => `${entry.target}:${installActionLabel(entry.action)}`)
      .join('  ');
    return `  ${first!.name.padEnd(28)} ${muted(perTarget)}${dep}`;
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
