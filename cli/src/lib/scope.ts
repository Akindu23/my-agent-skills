import { access, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { CliError } from './errors.js';

export type InstallScope = 'project' | 'global';

export interface ScopePaths {
  scope: InstallScope;
  agentsDir: string;
  skillsDir: string;
  lockPath: string;
  cwd: string;
}

export function resolveScope(
  opts: { global?: boolean; project?: boolean; cwd?: string },
): ScopePaths {
  const cwd = path.resolve(opts.cwd ?? process.cwd());

  if (opts.global && opts.project) {
    throw new CliError('Use only one of -g (global) or -p (project).');
  }

  let scope: InstallScope;
  if (opts.global) scope = 'global';
  else if (opts.project) scope = 'project';
  else {
    throw new CliError('Scope required. Pass -g (global) or -p (project).');
  }

  const agentsDir =
    scope === 'global'
      ? path.join(os.homedir(), '.agents')
      : path.join(cwd, '.agents');

  return {
    scope,
    agentsDir,
    skillsDir: path.join(agentsDir, 'skills'),
    lockPath: path.join(agentsDir, 'cursor-skills-lock.json'),
    cwd,
  };
}

export async function ensureAgentsDir(paths: ScopePaths): Promise<void> {
  await mkdir(paths.agentsDir, { recursive: true });
  await mkdir(paths.skillsDir, { recursive: true });
}

export async function prefersProjectScope(cwd: string): Promise<boolean> {
  for (const rel of ['.git', '.agents']) {
    try {
      await access(path.join(cwd, rel));
      return true;
    } catch {
      /* not found */
    }
  }
  return false;
}

export async function resolveScopeInteractive(
  flags: { global?: boolean; project?: boolean; yes?: boolean; cwd?: string },
  isTty: boolean,
): Promise<ScopePaths> {
  if (flags.global || flags.project) {
    return resolveScope(flags);
  }

  if (!isTty) {
    const { failNonInteractive } = await import('./output.js');
    failNonInteractive('Scope required. Pass -g (global) or -p (project).');
  }

  const { select, isCancel, cancel } = await import('@clack/prompts');
  const { CliCancel } = await import('./errors.js');
  const choice = await select({
    message: 'Select scope',
    options: [
      { value: 'project', label: 'Project (.agents/skills in current directory)' },
      { value: 'global', label: 'Global (~/.agents/skills)' },
    ],
  });

  if (isCancel(choice)) {
    cancel('Cancelled.');
    throw new CliCancel();
  }

  return resolveScope({
    project: choice === 'project',
    global: choice === 'global',
    cwd: flags.cwd,
  });
}
