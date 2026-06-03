import { runAdd } from '../commands/add.js';
import { runCheck } from '../commands/check.js';
import { runList } from '../commands/list.js';
import { runRemove } from '../commands/remove.js';
import { runSync } from '../commands/sync.js';
import { runUpdate } from '../commands/update.js';

const handlers = {
  add: runAdd,
  update: runUpdate,
  remove: runRemove,
  list: runList,
  sync: runSync,
  check: runCheck,
} as const;

export type CommandId = keyof typeof handlers;

export async function runCommand(
  id: CommandId,
  opts: Parameters<(typeof handlers)[CommandId]>[0],
): Promise<void> {
  await handlers[id](opts);
}
