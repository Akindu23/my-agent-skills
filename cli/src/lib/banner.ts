import { intro } from '@clack/prompts';
import { brand, muted } from './theme.js';

const REPO = 'https://github.com/Akindu23/my-agent-skills';

/** ANSI Shadow (same font as SKILLS) — generated via figlet; prior glyphs lacked kerning and read as CUREOR. */
const CURSOR_LINES = [
  ' ██████╗██╗   ██╗██████╗ ███████╗ ██████╗ ██████╗',
  '██╔════╝██║   ██║██╔══██╗██╔════╝██╔═══██╗██╔══██╗',
  '██║     ██║   ██║██████╔╝███████╗██║   ██║██████╔╝',
  '██║     ██║   ██║██╔══██╗╚════██║██║   ██║██╔══██╗',
  '╚██████╗╚██████╔╝██║  ██║███████║╚██████╔╝██║  ██║',
  ' ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝',
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

const LOGO_LINES = [...CURSOR_LINES, ...SKILLS_LINES];

function renderLogo(): string {
  return LOGO_LINES.map((line) => (line === '' ? '' : brand(line))).join('\n');
}

export function renderBanner(): string {
  return [
    '',
    renderLogo(),
    '',
    brand('Agent Skills for Cursor by Akindu Karunaratne'),
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
