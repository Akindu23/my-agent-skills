import { mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { assertValidSkillName } from './skill-paths.js';
import { CliError } from './errors.js';

export const LOCK_VERSION = 1;

export interface LockSkillEntry {
  source: string;
  sourceType: 'bundled';
  computedHash: string;
  linkType: 'symlink' | 'copy';
  installedAt: string;
  updatedAt: string;
}

export interface Lockfile {
  version: number;
  package: { name: string; version: string };
  skills: Record<string, LockSkillEntry>;
}

export async function readLockfile(lockPath: string): Promise<Lockfile | null> {
  try {
    const raw = await readFile(lockPath, 'utf8');
    const data = JSON.parse(raw) as Lockfile;
    if (data.version !== LOCK_VERSION) {
      throw new CliError(
        `Invalid lockfile version at ${lockPath}: expected ${LOCK_VERSION}, got ${String(data.version)}`,
      );
    }
    if (!data.skills || typeof data.skills !== 'object') {
      throw new CliError(`Invalid lockfile: ${lockPath}`);
    }
    for (const key of Object.keys(data.skills)) {
      assertValidSkillName(key);
    }
    return data;
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
    `.cursor-skills.lock.${process.pid}.${randomBytes(4).toString('hex')}.tmp`,
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

export function emptyLockfile(pkg: { name: string; version: string }): Lockfile {
  return {
    version: LOCK_VERSION,
    package: { name: pkg.name, version: pkg.version },
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
