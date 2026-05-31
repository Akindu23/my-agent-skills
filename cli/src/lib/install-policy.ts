import { isBrokenLink, pathExists } from './install.js';
import type { LockSkillEntry } from './lockfile.js';
import type { PlannedInstallAction } from './install-plan.js';

export async function resolvePlannedInstallAction(opts: {
  destDir: string;
  bundleHash: string;
  lockEntry?: LockSkillEntry;
}): Promise<PlannedInstallAction> {
  const { destDir, bundleHash, lockEntry } = opts;
  const onDisk = await pathExists(destDir);
  const healthy = onDisk && !(await isBrokenLink(destDir));

  if (!healthy) {
    return lockEntry ? 'update' : 'new';
  }

  if (!lockEntry) {
    return 'new';
  }

  if (lockEntry.computedHash === bundleHash) {
    return 'skip';
  }

  return 'confirm';
}
