import { note } from '@clack/prompts';
import { resolveBundle } from '../lib/bundle.js';
import { readLockfile } from '../lib/lockfile.js';
import { printJson } from '../lib/output.js';
import { pathExists, isBrokenLink } from '../lib/install.js';
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
    bundle = await resolveBundle({ source: opts.source });
  } catch {
    bundle = undefined;
  }

  const rawRows = await Promise.all(
    Object.entries(lock.skills).map(async ([name, entry]) => {
      const dest = resolveSkillDestDir(scope.skillsDir, name);
      const exists = await pathExists(dest);
      const broken = exists ? await isBrokenLink(dest) : false;
      const deps = bundle?.manifest.dependsOn[name];
      return {
        name,
        scope: scope.scope,
        linkType: entry.linkType,
        hashPrefix: entry.computedHash.slice(0, 8),
        path: dest,
        exists,
        healthy: exists && !broken,
        deps: deps?.length ? deps : undefined,
      };
    }),
  );

  if (opts.json) {
    printJson({
      scope: scope.scope,
      lockPath: scope.lockPath,
      skills: rawRows.map((row) => ({
        name: row.name,
        scope: row.scope,
        linkType: row.linkType,
        hashPrefix: row.hashPrefix,
        path: row.path,
        exists: row.exists,
        healthy: row.healthy,
        ...(row.deps ? { deps: row.deps } : {}),
      })),
    });
    return;
  }

  const summaryRows = buildListSummaryRows(rawRows, bundle);
  if (isInteractive) {
    note(renderListSummary({ scope, bundle, rows: summaryRows }), 'Installed skills');
    return;
  }

  for (const row of summaryRows) {
    console.log(
      `${row.name.padEnd(32)} ${row.linkType.padEnd(8)} ${row.hashPrefix}  ${row.status}`,
    );
  }
}
