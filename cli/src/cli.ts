#!/usr/bin/env node
import { Command } from 'commander';
import { CliCancel, CliError } from './lib/errors.js';
import { failBareNoSubcommand } from './lib/output.js';
import { resolveUiMode } from './lib/ui-mode.js';
import { runAdd } from './commands/add.js';
import { runHub } from './commands/hub.js';
import { runList } from './commands/list.js';
import { runRemove } from './commands/remove.js';
import { runSync } from './commands/sync.js';
import { runCheck } from './commands/check.js';
import { runUpdate } from './commands/update.js';

const program = new Command();

program
  .name('cursor-agent-skills')
  .description('Install and sync Cursor agent skills from the remote my-agent-skills GitHub pack')
  .version('0.1.0')
  .addHelpText('after', `

Examples:
  $ cursor-agent-skills
      (TTY: pick one action, then exit; use --menu to stay in the hub)
  $ cursor-agent-skills --menu
      (TTY: hub menu until Quit)
  $ cursor-agent-skills add --skill caveman -p -y
  $ cursor-agent-skills --skill caveman -p -y --json
  $ cursor-agent-skills check -p --json
  $ cursor-agent-skills update -p -y
`);

program
  .command('add')
  .description('Install skills into project or global .agents/skills')
  .option('-g, --global', 'Install to ~/.agents/skills')
  .option('-p, --project', 'Install to .agents/skills in current directory')
  .option('--skill <name>', 'Skill to install (repeatable)', (v, acc: string[]) => {
    acc.push(v);
    return acc;
  }, [])
  .option('--all', 'Install all skills from the bundle')
  .option('-y, --yes', 'Non-interactive; skip confirmation prompts')
  .option('--copy', 'Copy skill folders instead of symlinks')
  .option('--source <path>', 'Override skills bundle directory')
  .option('--json', 'Machine-readable output')
  .action(async (opts) => {
    await runAdd({
      global: opts.global,
      project: opts.project,
      skill: opts.skill,
      all: opts.all,
      yes: opts.yes,
      copy: opts.copy,
      source: opts.source,
      json: opts.json,
    });
  });

program
  .command('list')
  .description('List skills recorded in the lockfile for a scope')
  .option('-g, --global', 'Global scope')
  .option('-p, --project', 'Project scope')
  .option('--json', 'Machine-readable output')
  .action(async (opts) => {
    await runList({
      global: opts.global,
      project: opts.project,
      json: opts.json,
    });
  });

program
  .command('remove')
  .description('Remove skills from scope and lockfile')
  .option('-g, --global', 'Global scope')
  .option('-p, --project', 'Project scope')
  .option('--skill <name>', 'Skill to remove (repeatable)', (v, acc: string[]) => {
    acc.push(v);
    return acc;
  }, [])
  .option('-y, --yes', 'Non-interactive scope when -p/-g omitted')
  .option('--json', 'Machine-readable output')
  .action(async (opts) => {
    await runRemove({
      global: opts.global,
      project: opts.project,
      skill: opts.skill,
      yes: opts.yes,
      json: opts.json,
    });
  });

program
  .command('sync')
  .description('Restore missing or broken skill links from the lockfile')
  .option('-g, --global', 'Global scope')
  .option('-p, --project', 'Project scope')
  .option('--copy', 'Copy skill folders instead of symlinks')
  .option('--source <path>', 'Override skills bundle directory')
  .option('--json', 'Machine-readable output')
  .action(async (opts) => {
    await runSync({
      global: opts.global,
      project: opts.project,
      copy: opts.copy,
      source: opts.source,
      json: opts.json,
    });
  });

program
  .command('check')
  .description('Report lock vs bundle drift (exit 1 when stale)')
  .option('-g, --global', 'Global scope')
  .option('-p, --project', 'Project scope')
  .option('--source <path>', 'Override skills bundle directory')
  .option('--json', 'Machine-readable output')
  .action(async (opts) => {
    await runCheck({
      global: opts.global,
      project: opts.project,
      source: opts.source,
      json: opts.json,
    });
  });

program
  .command('update')
  .description('Refresh locked skills when bundle content drifted')
  .option('-g, --global', 'Global scope')
  .option('-p, --project', 'Project scope')
  .option('-y, --yes', 'Skip Proceed? prompt in TTY')
  .option('--source <path>', 'Override skills bundle directory')
  .option('--json', 'Machine-readable output')
  .action(async (opts) => {
    await runUpdate({
      global: opts.global,
      project: opts.project,
      yes: opts.yes,
      source: opts.source,
      json: opts.json,
    });
  });

const subcommands = new Set(['add', 'help', 'list', 'remove', 'sync', 'check', 'update']);

function argvWithoutHubFlags(argv: string[]): string[] {
  return argv.filter((arg) => arg !== '--menu');
}

function isHubInvoke(argv: string[]): boolean {
  const rest = argvWithoutHubFlags(argv).slice(2);
  return rest.length === 0;
}

function hubMenuMode(argv: string[]): boolean {
  return argv.includes('--menu');
}

function isHelpOrVersion(argv: string[]): boolean {
  const first = argv[2];
  return (
    first === '-h' ||
    first === '--help' ||
    first === '-V' ||
    first === '--version'
  );
}

function argvWithDefaultCommand(argv: string[]): string[] {
  const first = argv[2];
  if (
    !first ||
    first === '-h' ||
    first === '--help' ||
    first === '-V' ||
    first === '--version'
  ) {
    return argv;
  }
  if (subcommands.has(first)) {
    return argv;
  }
  return [...argv.slice(0, 2), 'add', ...argv.slice(2)];
}

async function main(): Promise<void> {
  try {
    const argv = process.argv;

    if (isHubInvoke(argv)) {
      if (isHelpOrVersion(argv)) {
        await program.parseAsync(argv);
        return;
      }

      if (resolveUiMode({}) === 'interactive') {
        await runHub({ menu: hubMenuMode(argv) });
        return;
      }

      failBareNoSubcommand();
    }

    await program.parseAsync(argvWithDefaultCommand(argvWithoutHubFlags(argv)));
  } catch (err) {
    if (err instanceof CliCancel) {
      process.exit(0);
    }
    if (err instanceof CliError) {
      console.error(err.message);
      process.exit(err.exitCode);
    }
    throw err;
  }
}

main();
