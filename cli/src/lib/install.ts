import { cp, lstat, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import { CliError } from './errors.js';

export type LinkType = 'symlink' | 'copy';

export async function materializeFromLockEntry(opts: {
  sourceDir: string;
  destDir: string;
  linkType: LinkType;
}): Promise<LinkType> {
  return materializeSkill({
    ...opts,
    copy: opts.linkType === 'copy',
  });
}

export async function materializeSkill(opts: {
  sourceDir: string;
  destDir: string;
  copy: boolean;
}): Promise<LinkType> {
  const { sourceDir, destDir, copy } = opts;
  const absSource = path.resolve(sourceDir);

  await rm(destDir, { recursive: true, force: true });

  if (copy) {
    await cp(absSource, destDir, { recursive: true });
    return 'copy';
  }

  try {
    const type = process.platform === 'win32' ? 'junction' : 'dir';
    await symlink(absSource, destDir, type);
    return 'symlink';
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'EPERM' || code === 'EACCES') {
      throw new CliError(
        `Permission denied creating symlink to ${absSource}. Try --copy or enable Developer Mode (Windows).`,
      );
    }
    throw err;
  }
}

export async function isBrokenLink(destDir: string): Promise<boolean> {
  try {
    const st = await lstat(destDir);
    if (!st.isSymbolicLink()) return false;
    const { access } = await import('node:fs/promises');
    await access(destDir);
    return false;
  } catch {
    return true;
  }
}

export async function pathExists(p: string): Promise<boolean> {
  try {
    await lstat(p);
    return true;
  } catch {
    return false;
  }
}

/** How a skill destination is materialized on disk (missing if absent). */
export async function onDiskMaterialization(
  destDir: string,
): Promise<'symlink' | 'copy' | 'missing'> {
  try {
    const st = await lstat(destDir);
    if (st.isSymbolicLink()) return 'symlink';
    return 'copy';
  } catch {
    return 'missing';
  }
}
