import { confirm, isCancel, note, outro, cancel } from '@clack/prompts';
import { applyDriftPlan } from '../lib/apply-drift-plan.js';
import { createDriftPlan, buildDriftReport } from '../lib/drift-plan.js';
import { renderDriftSummary } from '../lib/drift-summary.js';
import { CliCancel } from '../lib/errors.js';
import { printJson } from '../lib/output.js';
import { runScopedCommand } from '../lib/run-scoped-command.js';

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
  'Drift detected. Run update to refresh, or remove orphans interactively.';

export async function runCheck(opts: CheckOptions): Promise<void> {
  const { isInteractive, scope } = await runScopedCommand(opts);
  const plan = await createDriftPlan({ scope, source: opts.source });
  const report = buildDriftReport(plan);
  const summaryText = renderDriftSummary(plan, { mode: 'check' });

  if (opts.json) {
    printJson(report.jsonPayload);
  } else if (isInteractive) {
    note(summaryText, 'Check summary');

    if (report.hasDrift && opts.offerUpdateOnDrift) {
      const runUpdateNow = await confirm({
        message: 'Update drifted skills now?',
        initialValue: true,
      });
      if (isCancel(runUpdateNow)) {
        cancel('Cancelled.');
        throw new CliCancel();
      }
      if (runUpdateNow) {
        await applyDriftPlan(plan, {
          orphanPolicy: 'skip',
          isInteractive: false,
        });
        outro('Update complete.');
      } else {
        outro(DRIFT_HINT);
      }
    } else if (report.hasDrift) {
      outro(DRIFT_HINT);
    } else {
      outro('All skills in sync.');
    }
  } else {
    console.log(summaryText);
    if (report.hasDrift) {
      console.log(`\n${DRIFT_HINT}`);
    }
  }

  if (report.hasDrift && !isInteractive) {
    process.exit(1);
  }
}
