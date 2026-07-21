import { intro } from '@clack/prompts';
import { brand, muted } from './theme.js';

import { DEFAULT_GITHUB_SOURCE } from './constants.js';

const REPO = `https://github.com/${DEFAULT_GITHUB_SOURCE}`;

/** ANSI Shadow (same font as SKILLS) — generated via figlet. */
const AGENT_LINES = [
  ' █████╗  ██████╗ ███████╗███╗   ██╗████████╗',
  '██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝',
  '███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║',
  '██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║',
  '██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║',
  '╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝',
];

/** Block letters — SKILLS (skills CLI box drawing). */
const SKILLS_LINES = [
  '███████╗██╗  ██╗██╗██╗     ██╗     ███████╗',
  '██╔════╝██║ ██╔╝██║██║     ██║     ██╔════╝',
  '███████╗█████╔╝ ██║██║     ██║     ███████╗',
  '╚════██║██╔═██╗ ██║██║     ██║     ╚════██║',
  '███████║██║  ██╗██║███████╗███████╗███████║',
  '╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝',
];

const LOGO_LINES = [...AGENT_LINES, ...SKILLS_LINES];

function renderLogo(): string {
  return LOGO_LINES.map((line) => (line === '' ? '' : brand(line))).join('\n');
}

export function renderBanner(): string {
  return [
    '',
    renderLogo(),
    '',
    brand('Agent Skills for Cursor & Claude Code by Akindu Karunaratne'),
    '',
    `${muted('Repository:')} ${brand(REPO)}`,
    '',
  ].join('\n');
}

export function showTTYIntro(opts?: { skip?: boolean }): void {
  if (opts?.skip) {
    return;
  }
  intro(renderBanner());
}
