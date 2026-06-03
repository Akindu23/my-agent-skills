import { note, outro } from '@clack/prompts';
import {
  resolveBundle,
  skillSourcePath,
  readSkillFrontmatterName,
} from '../lib/bundle.js';
import { computeSkillFolderHash } from '../lib/hash.js';
import { materializeSkill, pathExists, isBrokenLink } from '../lib/install.js';
import {
  readLockfile,
  syncLockRootFromBundle,
  upsertSkill,
  writeLockfile,
} from '../lib/lockfile.js';
import { CliError } from '../lib/errors.js';
import { printJson } from '../lib/output.js';
import { resolveSkillDestDir } from '../lib/skill-paths.js';
import { ensureAgentsDir } from '../lib/scope.js';
import { runScopedCommand } from '../lib/run-scoped-command.js';
import {
  buildSyncSummaryRows,
  renderSyncSummary,
} from '../lib/sync-summary.js';

export interface SyncOptions {
  global?: boolean;
  project?: boolean;
  copy?: boolean;
  source?: string;
  json?: boolean;
  cwd?: string;
  skipIntro?: boolean;
}

export async function runSync(opts: SyncOptions): Promise<void> {
  const { isInteractive, scope } = await runScopedCommand(opts);
  const lock = await readLockfile(scope.lockPath);
  if (!lock || Object.keys(lock.skills).length === 0) {
    throw new CliError(`No lockfile or empty skills at ${scope.lockPath}. Run add first.`);
  }

  const bundle = await resolveBundle({
    source: opts.source,
    githubSource: lock.source,
    commit: lock.commit || undefined,
  });
  await ensureAgentsDir(scope);

  const synced: string[] = [];
  const ok: string[] = [];

  for (const name of Object.keys(lock.skills).sort()) {
    const destDir = resolveSkillDestDir(scope.skillsDir, name);
    const exists = await pathExists(destDir);
    const broken = exists && (await isBrokenLink(destDir));
    const needsInstall = !exists || broken;

    if (!needsInstall) {
      ok.push(name);
      continue;
    }

    const sourceDir = skillSourcePath(bundle, name);
    try {
      await readSkillFrontmatterName(sourceDir);
    } catch {
      throw new CliError(`Skill "${name}" is in lockfile but missing from remote pack at ${lock.commit}.`);
    }

    const linkType = await materializeSkill({
      sourceDir,
      destDir,
      copy: opts.copy ?? false,
    });
    const computedHash = await computeSkillFolderHash(sourceDir);
    const entry = lock.skills[name]!;

    upsertSkill(lock, name, {
      source: entry.source,
      sourceType: 'github',
      computedHash,
      linkType,
      installedAt: entry.installedAt,
    });
    synced.push(name);
  }

  syncLockRootFromBundle(lock, bundle);
  await writeLockfile(scope.lockPath, lock);

  const allNames = Object.keys(lock.skills);
  const summaryRows = buildSyncSummaryRows(allNames, synced, bundle);

  if (opts.json) {
    printJson({
      scope: scope.scope,
      synced,
      ok,
      lockPath: scope.lockPath,
    });
    return;
  }

  if (isInteractive) {
    note(renderSyncSummary({ scope, bundle, rows: summaryRows }), 'Sync summary');
    if (synced.length > 0) {
      outro(`Synced ${synced.length} skill(s).`);
    } else {
      outro('All skills present.');
    }
    return;
  }

  if (synced.length === 0) {
    console.log(`All ${ok.length} skill(s) present (${scope.scope}).`);
  } else {
    console.log(`Synced ${synced.length} skill(s) in ${scope.skillsDir}`);
  }
}
