import {
  isBrokenLink,
  onDiskMaterialization,
  pathExists,
} from './install.js';

export type MaterializationHealth =
  | { status: 'ok' }
  | { status: 'missing' }
  | { status: 'broken' }
  | {
      status: 'linkTypeMismatch';
      onDisk: 'symlink' | 'copy';
      want: 'symlink' | 'copy';
    };

/** Shared on-disk health used by sync and check. */
export async function assessMaterializationHealth(
  destDir: string,
  wantLinkType: 'symlink' | 'copy',
): Promise<MaterializationHealth> {
  const exists = await pathExists(destDir);
  if (!exists) return { status: 'missing' };

  if (await isBrokenLink(destDir)) return { status: 'broken' };

  const onDisk = await onDiskMaterialization(destDir);
  if (onDisk === 'missing') return { status: 'missing' };
  if (onDisk !== wantLinkType) {
    return { status: 'linkTypeMismatch', onDisk, want: wantLinkType };
  }
  return { status: 'ok' };
}

export function healthNeedsRepair(health: MaterializationHealth): boolean {
  return health.status !== 'ok';
}
