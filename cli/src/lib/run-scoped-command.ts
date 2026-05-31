import { showTTYIntro } from './banner.js';
import { resolveScopeInteractive, type ScopePaths } from './scope.js';
import { resolveUiMode, type UiMode } from './ui-mode.js';

export interface ScopedCommandOpts {
  json?: boolean;
  skipIntro?: boolean;
  global?: boolean;
  project?: boolean;
  cwd?: string;
  yes?: boolean;
}

export interface ScopedCommandContext {
  uiMode: UiMode;
  isInteractive: boolean;
  isJson: boolean;
  scope: ScopePaths;
}

export async function runScopedCommand(
  opts: ScopedCommandOpts & {
    afterIntro?: (ctx: ScopedCommandContext) => void | Promise<void>;
  },
): Promise<ScopedCommandContext> {
  const uiMode = resolveUiMode({ json: opts.json });
  const isInteractive = uiMode === 'interactive';
  const isJson = uiMode === 'json';

  if (isInteractive) {
    showTTYIntro({ skip: opts.skipIntro });
  }

  const ctx: ScopedCommandContext = {
    uiMode,
    isInteractive,
    isJson,
    scope: await resolveScopeInteractive(
      {
        global: opts.global,
        project: opts.project,
        yes: opts.yes,
        cwd: opts.cwd,
      },
      isInteractive,
    ),
  };

  if (opts.afterIntro) {
    await opts.afterIntro(ctx);
  }

  return ctx;
}
