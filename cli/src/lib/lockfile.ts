import { mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { DEFAULT_GITHUB_SOURCE } from './constants.js';
import { assertValidSkillName } from './skill-paths.js';
import { CliError } from './errors.js';

export const LOCK_VERSION = 2;

export interface LockSkillEntry {
  source: string;
  sourceType: 'github';
  computedHash: string;
  linkType: 'symlink' | 'copy';
  installedAt: string;
  updatedAt: string;
}

export interface Lockfile {
  version: number;
  source: string;
  sourceType: 'github';
  commit: string;
  package: { name: string; version: string };
  skills: Record<string, LockSkillEntry>;
}

interface LockfileV1 {
  version: 1;
  package: { name: string; version: string };
  skills: Record<
    string,
    {
      source: string;
      sourceType: 'bundled';
      computedHash: string;
      linkType: 'symlink' | 'copy';
      installedAt: string;
      updatedAt: string;
    }
  >;
}

function migrateV1ToV2(data: LockfileV1): Lockfile {
  const skills: Record<string, LockSkillEntry> = {};
  for (const [name, entry] of Object.entries(data.skills)) {
    skills[name] = {
      source: DEFAULT_GITHUB_SOURCE,
      sourceType: 'github',
      computedHash: entry.computedHash,
      linkType: entry.linkType,
      installedAt: entry.installedAt,
      updatedAt: entry.updatedAt,
    };
  }

  return {
    version: LOCK_VERSION,
    source: DEFAULT_GITHUB_SOURCE,
    sourceType: 'github',
    commit: '',
    package: data.package,
    skills,
  };
}

function normalizeLock(data: Record<string, unknown>): Lockfile {
  const version = data.version as number;

  if (version === 1) {
    return migrateV1ToV2(data as unknown as LockfileV1);
  }

  if (version !== LOCK_VERSION) {
    throw new CliError(
      `Invalid lockfile version: expected ${LOCK_VERSION}, got ${String(version)}. Run cursor-agent-skills update after upgrading the CLI.`,
    );
  }

  const lock = data as unknown as Lockfile;
  if (!lock.source || !lock.sourceType || typeof lock.commit !== 'string') {
    throw new CliError('Invalid lockfile: missing source, sourceType, or commit.');
  }
  if (!lock.skills || typeof lock.skills !== 'object') {
    throw new CliError('Invalid lockfile: missing skills map.');
  }
  return lock;
}

export async function readLockfile(lockPath: string): Promise<Lockfile | null> {
  try {
    const raw = await readFile(lockPath, 'utf8');
    const data = JSON.parse(raw) as Record<string, unknown>;
    const lock = normalizeLock(data);
    for (const key of Object.keys(lock.skills)) {
      assertValidSkillName(key);
    }
    return lock;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    if (err instanceof CliError) throw err;
    throw new CliError(`Could not parse lockfile: ${lockPath}`);
  }
}

export async function writeLockfile(lockPath: string, lock: Lockfile): Promise<void> {
  const sortedSkills: Record<string, LockSkillEntry> = {};
  for (const key of Object.keys(lock.skills).sort()) {
    sortedSkills[key] = lock.skills[key]!;
  }
  const out: Lockfile = { ...lock, skills: sortedSkills };
  const content = `${JSON.stringify(out, null, 2)}\n`;
  const dir = path.dirname(lockPath);
  const tmp = path.join(
    dir,
    `.cursor-skills-lock.json.${process.pid}.${randomBytes(4).toString('hex')}.tmp`,
  );

  try {
    await mkdir(dir, { recursive: true });
    const fh = await open(tmp, 'wx');
    try {
      await fh.writeFile(content, 'utf8');
      await fh.sync();
    } finally {
      await fh.close();
    }
    await rename(tmp, lockPath);
  } catch (err) {
    await unlink(tmp).catch(() => {});
    if (err instanceof CliError) throw err;
    throw new CliError(`Could not write lockfile: ${lockPath}`);
  }
}

export function emptyLockfile(opts: {
  source: string;
  commit: string;
  package: { name: string; version: string };
}): Lockfile {
  return {
    version: LOCK_VERSION,
    source: opts.source,
    sourceType: 'github',
    commit: opts.commit,
    package: opts.package,
    skills: {},
  };
}

export function upsertSkill(
  lock: Lockfile,
  name: string,
  entry: Omit<LockSkillEntry, 'installedAt' | 'updatedAt'> & {
    installedAt?: string;
    updatedAt?: string;
  },
): void {
  assertValidSkillName(name);
  const now = new Date().toISOString();
  const existing = lock.skills[name];
  lock.skills[name] = {
    ...entry,
    installedAt: existing?.installedAt ?? entry.installedAt ?? now,
    updatedAt: entry.updatedAt ?? now,
  };
}

export function removeSkill(lock: Lockfile, name: string): boolean {
  assertValidSkillName(name);
  if (!lock.skills[name]) return false;
  delete lock.skills[name];
  return true;
}

export function syncLockRootFromBundle(
  lock: Lockfile,
  bundle: { githubSource: string; commit: string; packageName: string; packageVersion: string },
): void {
  lock.source = bundle.githubSource;
  lock.sourceType = 'github';
  lock.commit = bundle.commit;
  lock.package = { name: bundle.packageName, version: bundle.packageVersion };
}
