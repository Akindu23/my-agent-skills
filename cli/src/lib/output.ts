import { CliError } from './errors.js';

export type OutputMode = 'human' | 'json';

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function failNonInteractive(message: string): never {
  throw new CliError(
    `${message}\n\nExample:\n  cursor-agent-skills add --skill pitstop -p -y`,
  );
}

export function failBareNoSubcommand(): never {
  throw new CliError(
    [
      'Subcommand required in non-interactive mode.',
      '',
      'Commands: add, update, remove, list, sync, check',
      '',
      'Example:',
      '  cursor-agent-skills add --skill pitstop -p -y',
      '',
      'Run cursor-agent-skills --help for full usage.',
    ].join('\n'),
  );
}
