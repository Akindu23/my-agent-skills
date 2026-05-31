export type UiMode = 'json' | 'nonInteractive' | 'interactive';

export function resolveUiMode(opts: {
  json?: boolean;
  stdin?: NodeJS.ReadStream;
  stdout?: NodeJS.WriteStream;
}): UiMode {
  if (opts.json) {
    return 'json';
  }

  const stdin = opts.stdin ?? process.stdin;
  const stdout = opts.stdout ?? process.stdout;
  if (stdin.isTTY === true && stdout.isTTY === true) {
    return 'interactive';
  }

  return 'nonInteractive';
}
