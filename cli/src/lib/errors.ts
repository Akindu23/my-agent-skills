export class CliError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = 'CliError';
    this.exitCode = exitCode;
  }
}

export class CliCancel extends Error {
  readonly exitCode = 0;

  constructor(message = 'Cancelled.') {
    super(message);
    this.name = 'CliCancel';
  }
}
