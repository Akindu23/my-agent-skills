import { note, outro } from '@clack/prompts';
import {
  resolveBundle,
  skillSourcePath,
  readSkillFrontmatterName,
} from '../lib/bundle.js';
import { computeSkillFolderHash } from '../lib/hash.js';
import { materializeSkill } from '../lib/install.js';
import {
  assessMaterializationHealth,
  healthNeedsRepair,
} from '../lib/install-health.js';
import {
  ensureTargetSkillsDirs,
  resolveEffectiveTargets,
  resolveTargetSkillsDir,
  type InstallTarget,
} from '../lib/install-targets.js';
import {
  readLockfile,
  syncLockRootFromBundle,
  upsertSkill,
  writeLockfile,
} from '../lib/lockfile.js';
import { CliError } from '../lib/errors.js';
import { printJson } from '../lib/output.js';
import { resolveSkillDestDir } from '../lib/skill-paths.js';
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
  yes?: boolean;
  json?: boolean;
  cwd?: string;
  skipIntro?: boolean;
}

export async function runSync(opts: SyncOptions): Promise<void> {
  // opts.yes is accepted as a documented no-op for script compatibility (sync -p -y).
  void opts.yes;

  const { isInteractive, scope } = await runScopedCommand(opts);
  const lock = await readLockfile(scope.lockPath);
  if (!lock || Object.keys(lock.skills).length === 0) {
    throw new CliError(`No lockfile or empty skills at ${scope.lockPath}. Run add first.`);
  }

  const targets = resolveEffectiveTargets(lock);
  const bundle = await resolveBundle({
    source: opts.source,
    githubSource: lock.source,
    commit: lock.commit || undefined,
  });
  await ensureTargetSkillsDirs(scope, targets);

  const synced: string[] = [];
  const ok: string[] = [];
  const failed: Array<{ name: string; target: InstallTarget; error: string }> = [];
  const byTarget: Record<string, { synced: string[]; ok: string[]; failed: string[] }> = {};
  for (const t of targets) {
    byTarget[t] = { synced: [], ok: [], failed: [] };
  }

  type PendingUpsert = {
    name: string;
    source: string;
    computedHash: string;
    linkType: 'symlink' | 'copy';
    installedAt: string;
  };
  const pendingUpserts = new Map<string, PendingUpsert>();

  for (const name of Object.keys(lock.skills).sort()) {
    const entry = lock.skills[name]!;
    let anySynced = false;
    let allOk = true;

    for (const target of targets) {
      const destDir = resolveSkillDestDir(resolveTargetSkillsDir(scope, target), name);
      const wantLinkType =
        opts.copy || entry.linkType === 'copy' ? 'copy' : 'symlink';
      const health = await assessMaterializationHealth(destDir, wantLinkType);

      if (!healthNeedsRepair(health)) {
        byTarget[target]!.ok.push(name);
        continue;
      }

      allOk = false;
      const sourceDir = skillSourcePath(bundle, name);
      try {
        try {
          await readSkillFrontmatterName(sourceDir);
        } catch {
          throw new CliError(
            `Skill "${name}" is in lockfile but missing from remote pack at ${lock.commit}.`,
          );
        }

        const linkType = await materializeSkill({
          sourceDir,
          destDir,
          copy: wantLinkType === 'copy',
        });
        const computedHash = await computeSkillFolderHash(sourceDir);

        pendingUpserts.set(name, {
          name,
          source: entry.source,
          computedHash,
          linkType,
          installedAt: entry.installedAt,
        });
        byTarget[target]!.synced.push(name);
        anySynced = true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        byTarget[target]!.failed.push(name);
        failed.push({ name, target, error: message });
      }
    }

    if (anySynced) synced.push(name);
    else if (allOk) ok.push(name);
  }

  if (failed.length > 0) {
    if (opts.json) {
      printJson({
        scope: scope.scope,
        targets: byTarget,
        synced,
        ok,
        failed: failed.map((f) => ({ name: f.name, target: f.target, error: f.error })),
        lockPath: scope.lockPath,
      });
    } else if (isInteractive) {
      const dests = targets.map((t) => resolveTargetSkillsDir(scope, t));
      const targetLines = targets.map((t) => {
        const s = byTarget[t]!;
        return `  ${t}: ${s.synced.length} synced, ${s.ok.length} ok, ${s.failed.length} failed`;
      });
      note(
        [renderSyncSummary({ scope, bundle, rows: buildSyncSummaryRows(Object.keys(lock.skills), synced, bundle), destinations: dests }), '', 'By target:', ...targetLines].join(
          '\n',
        ),
        'Sync summary',
      );
      outro(`Synced with ${failed.length} failure(s).`);
    } else {
      console.log(`Synced with ${failed.length} failure(s) (${scope.scope}).`);
      for (const f of failed) {
        console.log(`  ${f.target}/${f.name}: ${f.error}`);
      }
    }
    throw new CliError(`Sync failed for ${failed.length} skill target(s).`);
  }

  for (const upsert of pendingUpserts.values()) {
    upsertSkill(lock, upsert.name, {
      source: upsert.source,
      sourceType: 'github',
      computedHash: upsert.computedHash,
      linkType: upsert.linkType,
      installedAt: upsert.installedAt,
    });
  }

  syncLockRootFromBundle(lock, bundle);
  await writeLockfile(scope.lockPath, lock);

  const allNames = Object.keys(lock.skills);
  const summaryRows = buildSyncSummaryRows(allNames, synced, bundle);

  if (opts.json) {
    printJson({
      scope: scope.scope,
      targets: byTarget,
      synced,
      ok,
      failed: [],
      lockPath: scope.lockPath,
    });
  } else if (isInteractive) {
    const dests = targets.map((t) => resolveTargetSkillsDir(scope, t));
    const targetLines = targets.map((t) => {
      const s = byTarget[t]!;
      return `  ${t}: ${s.synced.length} synced, ${s.ok.length} ok, ${s.failed.length} failed`;
    });
    note(
      [renderSyncSummary({ scope, bundle, rows: summaryRows, destinations: dests }), '', 'By target:', ...targetLines].join(
        '\n',
      ),
      'Sync summary',
    );
    if (synced.length > 0) {
      outro(`Synced ${synced.length} skill(s).`);
    } else {
      outro('All skills present.');
    }
  } else if (synced.length === 0) {
    console.log(`All ${ok.length} skill(s) present (${scope.scope}).`);
  } else {
    const dests = targets.map((t) => resolveTargetSkillsDir(scope, t)).join(', ');
    console.log(`Synced ${synced.length} skill(s) in ${dests}`);
  }
}
