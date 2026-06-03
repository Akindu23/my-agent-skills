import { execa } from 'execa';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cliJs = path.join(cliRoot, 'dist/cli.js');

export async function runCli(
  args: string[],
  opts?: { cwd?: string; env?: NodeJS.ProcessEnv; nonTty?: boolean },
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const piped = opts?.nonTty === true;
    const result = await execa('node', [cliJs, ...args], {
      cwd: opts?.cwd,
      env: { ...process.env, ...opts?.env },
      reject: false,
      stdin: piped ? 'pipe' : undefined,
      stdout: piped ? 'pipe' : undefined,
      stderr: piped ? 'pipe' : undefined,
    });
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode ?? 0,
    };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; exitCode?: number };
    return {
      stdout: e.stdout ?? '',
      stderr: e.stderr ?? '',
      exitCode: e.exitCode ?? 1,
    };
  }
}

export { cliRoot };
