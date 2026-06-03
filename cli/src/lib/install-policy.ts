import { isBrokenLink, onDiskMaterialization, pathExists } from './install.js';
import type { LockSkillEntry } from './lockfile.js';
import type { PlannedInstallAction, PlannedLinkType } from './install-plan.js';

export async function resolvePlannedInstallAction(opts: {
  destDir: string;
  bundleHash: string;
  lockEntry?: LockSkillEntry;
  plannedLinkType: PlannedLinkType;
}): Promise<PlannedInstallAction> {
  const { destDir, bundleHash, lockEntry, plannedLinkType } = opts;
  const onDisk = await onDiskMaterialization(destDir);
  const healthy = onDisk !== 'missing' && !(await isBrokenLink(destDir));

  if (!healthy) {
    return lockEntry ? 'update' : 'new';
  }

  if (!lockEntry) {
    return 'new';
  }

  const linkTypeMismatch =
    onDisk !== plannedLinkType ||
    lockEntry.linkType !== plannedLinkType;

  if (lockEntry.computedHash === bundleHash) {
    return linkTypeMismatch ? 'confirm' : 'skip';
  }

  return 'confirm';
}
