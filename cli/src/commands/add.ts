import { note, outro } from '@clack/prompts';
import { applyInstallPlan } from '../lib/apply-install-plan.js';
import { createInstallPlan } from '../lib/install-plan.js';
import { renderInstallCompletion } from '../lib/install-outro.js';
import { renderInstallSummary } from '../lib/install-summary.js';
import { printJson } from '../lib/output.js';
import {
  confirmInstallPlan,
  promptLinkType,
  promptSkillSelection,
} from '../lib/prompts.js';
import { resolveBundle } from '../lib/bundle.js';
import { runScopedCommand } from '../lib/run-scoped-command.js';

export interface AddOptions {
  global?: boolean;
  project?: boolean;
  skill?: string[];
  all?: boolean;
  yes?: boolean;
  copy?: boolean;
  symlink?: boolean;
  source?: string;
  json?: boolean;
  skipIntro?: boolean;
}

export async function runAdd(opts: AddOptions): Promise<void> {
  let selected: string[] = [];
  let linkType: 'symlink' | 'copy' | undefined;

  const { isInteractive, scope } = await runScopedCommand({
    global: opts.global,
    project: opts.project,
    yes: opts.yes,
    json: opts.json,
    skipIntro: opts.skipIntro,
    afterIntro: async (ctx) => {
      const bundle = await resolveBundle({ source: opts.source });
      if (ctx.isInteractive) {
        note(`Found ${bundle.manifest.skills.length} skills`, 'Remote pack');
      }
      selected = await promptSkillSelection(bundle, ctx.isInteractive, {
        skills: opts.skill,
        all: opts.all,
      });
      linkType = await promptLinkType(ctx.isInteractive, {
        copy: opts.copy,
        symlink: opts.symlink,
      });
    },
  });

  if (linkType === undefined) {
    linkType = await promptLinkType(isInteractive, {
      copy: opts.copy,
      symlink: opts.symlink,
    });
  }

  const bundle = await resolveBundle({ source: opts.source });
  const plan = await createInstallPlan({
    bundle,
    source: opts.source,
    selected,
    scope,
    copy: opts.copy,
    linkType,
  });

  if (isInteractive) {
    note(renderInstallSummary(plan), 'Installation summary');
    const proceed = await confirmInstallPlan(plan, { autoYes: opts.yes ?? false });
    if (!proceed) {
      const allSkip = plan.entries.every((e) => e.action === 'skip');
      outro(allSkip ? 'All skills already up to date.' : 'Cancelled. No changes made.');
      return;
    }
  }

  const { installed, reinstalled, skipped, installedEntries, skippedEntries } =
    await applyInstallPlan(plan, { copy: linkType === 'copy' });

  for (const entry of plan.entries) {
    if (
      entry.action !== 'skip' &&
      entry.dependencyOf &&
      !opts.json &&
      !isInteractive &&
      entry.action !== 'confirm'
    ) {
      console.log(`  also installed ${entry.name} (dependency of ${entry.dependencyOf})`);
    }
  }

  if (!opts.json && !isInteractive) {
    for (const entry of plan.entries) {
      if (entry.action === 'skip') {
        console.log(`  skipped ${entry.name} (already up to date)`);
      } else if (entry.action === 'confirm') {
        console.log(`  reinstalled ${entry.name} (bundle hash drift)`);
      }
    }
  }

  if (opts.json) {
    printJson({
      scope: scope.scope,
      installed,
      reinstalled,
      skipped,
      lockPath: scope.lockPath,
    });
    return;
  }

  if (isInteractive) {
    note(
      renderInstallCompletion({
        installed: installedEntries,
        skipped: skippedEntries,
        skillsDir: scope.skillsDir,
      }),
      'Complete',
    );
    outro('Done!');
    return;
  }

  const parts: string[] = [];
  if (installed.length > 0) {
    parts.push(`installed ${installed.length}`);
  }
  if (reinstalled.length > 0) {
    parts.push(`reinstalled ${reinstalled.length}`);
  }
  if (skipped.length > 0) {
    parts.push(`skipped ${skipped.length} up to date`);
  }
  const summary = parts.length > 0 ? parts.join(', ') : 'no changes';

  console.log(`${summary.charAt(0).toUpperCase() + summary.slice(1)} in ${scope.skillsDir} (${scope.scope})`);
  console.log(`Lockfile: ${scope.lockPath}`);
}
