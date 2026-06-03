import { brand } from './theme.js';

export interface SummaryHeaderInput {
  pack?: string;
  scope: string;
  destination: string;
  lockPath?: string;
  extraLines?: string[];
}

export function renderSummaryHeader(input: SummaryHeaderInput): string[] {
  const lines: string[] = [];
  if (input.pack) {
    lines.push(`${brand('Pack')}: ${input.pack}`);
  }
  lines.push(`${brand('Scope')}: ${input.scope}`);
  lines.push(`${brand('Destination')}: ${input.destination}`);
  if (input.lockPath) {
    lines.push(`${brand('Lockfile')}: ${input.lockPath}`);
  }
  if (input.extraLines?.length) {
    lines.push(...input.extraLines);
  }
  return lines;
}
