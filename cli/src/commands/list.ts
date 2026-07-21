import { note } from '@clack/prompts';
import { resolveBundle } from '../lib/bundle.js';
import { assessMaterializationHealth } from '../lib/install-health.js';
import {
  resolveEffectiveTargets,
  resolveTargetSkillsDir,
} from '../lib/install-targets.js';
import { readLockfile } from '../lib/lockfile.js';
import { printJson } from '../lib/output.js';
import {
  buildListSummaryRows,
  renderListSummary,
} from '../lib/list-summary.js';
import { resolveSkillDestDir } from '../lib/skill-paths.js';
import { runScopedCommand } from '../lib/run-scoped-command.js';

export interface ListOptions {
  global?: boolean;
  project?: boolean;
  json?: boolean;
  source?: string;
  cwd?: string;
  skipIntro?: boolean;
}

export async function runList(opts: ListOptions): Promise<void> {
  const { isInteractive, scope } = await runScopedCommand(opts);
  const lock = await readLockfile(scope.lockPath);

  if (!lock || Object.keys(lock.skills).length === 0) {
    if (opts.json) {
      printJson({ scope: scope.scope, skills: [] });
      return;
    }
    console.log(`No skills in lockfile (${scope.lockPath}).`);
    return;
  }

  let bundle;
  try {
    bundle = await resolveBundle({
      source: opts.source,
      githubSource: lock.source,
      commit: lock.commit || undefined,
    });
  } catch {
    bundle = undefined;
  }

  const targets = resolveEffectiveTargets(lock);
  const destinations = targets.map((t) => resolveTargetSkillsDir(scope, t));

  const rawRows = await Promise.all(
    Object.entries(lock.skills).map(async ([name, entry]) => {
      const byTarget: Record<
        string,
        { path: string; status: string; healthy: boolean }
      > = {};
      let healthy = true;
      let exists = false;

      for (const target of targets) {
        const dest = resolveSkillDestDir(resolveTargetSkillsDir(scope, target), name);
        const health = await assessMaterializationHealth(dest, entry.linkType);
        const targetHealthy = health.status === 'ok';
        byTarget[target] = {
          path: dest,
          status: health.status,
          healthy: targetHealthy,
        };
        if (!targetHealthy) healthy = false;
        if (health.status !== 'missing') exists = true;
      }

      const deps = bundle?.manifest.dependsOn[name];
      return {
        name,
        scope: scope.scope,
        linkType: entry.linkType,
        hashPrefix: entry.computedHash.slice(0, 8),
        path: byTarget[targets[0]!]!.path,
        paths: Object.fromEntries(
          Object.entries(byTarget).map(([t, v]) => [t, v.path]),
        ),
        targets: byTarget,
        exists,
        healthy,
        deps: deps?.length ? deps : undefined,
      };
    }),
  );

  if (opts.json) {
    printJson({
      scope: scope.scope,
      lockPath: scope.lockPath,
      installTargets: targets,
      skills: rawRows.map((row) => ({
        name: row.name,
        scope: row.scope,
        linkType: row.linkType,
        hashPrefix: row.hashPrefix,
        path: row.path,
        paths: row.paths,
        targets: row.targets,
        exists: row.exists,
        healthy: row.healthy,
        ...(row.deps ? { deps: row.deps } : {}),
      })),
    });
    return;
  }

  const summaryRows = buildListSummaryRows(rawRows, bundle);
  if (isInteractive) {
    note(
      renderListSummary({
        scope,
        bundle,
        rows: summaryRows,
        destinations,
      }),
      'Installed skills',
    );
    return;
  }

  for (const row of summaryRows) {
    console.log(
      `${row.name.padEnd(32)} ${row.linkType.padEnd(8)} ${row.hashPrefix}  ${row.status}`,
    );
  }
}
