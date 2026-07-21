import { confirm, isCancel, note, outro, cancel } from '@clack/prompts';
import {
  assessTargetHealth,
  buildDriftReport,
  createDriftPlan,
} from '../lib/drift-plan.js';
import { renderDriftSummary } from '../lib/drift-summary.js';
import { CliCancel } from '../lib/errors.js';
import { printJson } from '../lib/output.js';
import { runScopedCommand } from '../lib/run-scoped-command.js';
import { runUpdate } from './update.js';

export interface CheckOptions {
  global?: boolean;
  project?: boolean;
  source?: string;
  json?: boolean;
  cwd?: string;
  skipIntro?: boolean;
  /** Hub only: after drift summary, offer to run update then exit. */
  offerUpdateOnDrift?: boolean;
}

const DRIFT_HINT =
  'Pack or skill drift detected. Run update to advance the pin and refresh skills.';
const HEALTH_HINT =
  'One or more install targets are unhealthy. Run sync to repair materializations.';

function renderTargetHealthLines(
  targets: Record<string, { healthy: boolean; skills: Array<{ name: string; status: string }> }>,
): string[] {
  const lines: string[] = ['', 'Install targets:'];
  for (const [target, report] of Object.entries(targets)) {
    lines.push(`  ${target}: ${report.healthy ? 'healthy' : 'unhealthy'}`);
    for (const skill of report.skills) {
      if (skill.status !== 'ok') {
        lines.push(`    ${skill.name}: ${skill.status}`);
      }
    }
  }
  return lines;
}

function emitRemediationHints(opts: {
  hasContentDrift: boolean;
  hasUnhealthyTargets: boolean;
  interactive: boolean;
}): void {
  const hints: string[] = [];
  if (opts.hasUnhealthyTargets) hints.push(HEALTH_HINT);
  if (opts.hasContentDrift) hints.push(DRIFT_HINT);
  if (hints.length === 0) return;
  if (opts.interactive) {
    outro(hints.join('\n'));
  } else {
    console.log(`\n${hints.join('\n')}`);
  }
}

export async function runCheck(opts: CheckOptions): Promise<void> {
  const { isInteractive, scope } = await runScopedCommand(opts);
  const plan = await createDriftPlan({ scope, source: opts.source });
  const targetHealth = await assessTargetHealth(plan);
  const report = buildDriftReport(plan, targetHealth);
  const summaryText = [
    renderDriftSummary(plan, { mode: 'check' }),
    ...renderTargetHealthLines(targetHealth),
  ].join('\n');

  if (opts.json) {
    printJson(report.jsonPayload);
  } else if (isInteractive) {
    note(summaryText, 'Check summary');

    if (
      report.hasContentDrift &&
      opts.offerUpdateOnDrift &&
      !report.hasUnhealthyTargets
    ) {
      const runUpdateNow = await confirm({
        message: 'Run update now?',
        initialValue: true,
      });
      if (isCancel(runUpdateNow)) {
        cancel('Cancelled.');
        throw new CliCancel();
      }
      if (runUpdateNow) {
        await runUpdate({
          project: scope.scope === 'project',
          global: scope.scope === 'global',
          source: opts.source,
          cwd: scope.cwd,
          skipIntro: true,
          skipDriftSummary: true,
        });
      } else {
        outro(DRIFT_HINT);
      }
    } else if (report.hasDrift) {
      emitRemediationHints({
        hasContentDrift: report.hasContentDrift,
        hasUnhealthyTargets: report.hasUnhealthyTargets,
        interactive: true,
      });
    } else {
      outro('All skills in sync.');
    }
  } else {
    console.log(summaryText);
    emitRemediationHints({
      hasContentDrift: report.hasContentDrift,
      hasUnhealthyTargets: report.hasUnhealthyTargets,
      interactive: false,
    });
  }

  if (report.hasDrift && !isInteractive) {
    process.exit(1);
  }
}
