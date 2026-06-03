import type { InstallPlanEntry } from './install-plan.js';
import { muted, success } from './theme.js';

function pastTense(linkType: InstallPlanEntry['linkType']): string {
  return linkType === 'copy' ? 'copied' : 'symlinked';
}

export function renderInstallCompletion(opts: {
  installed: InstallPlanEntry[];
  skipped: InstallPlanEntry[];
  skillsDir: string;
}): string {
  const lines: string[] = [];
  lines.push(success(`Installed ${opts.installed.length} skill(s)`));

  for (const entry of opts.installed) {
    lines.push(
      `  ${success('ok')} ${entry.name} (${pastTense(entry.linkType)}) ${muted(entry.destDir)}`,
    );
  }

  if (opts.skipped.length > 0) {
    lines.push('');
    lines.push(`Skipped ${opts.skipped.length} already up-to-date skill(s)`);
    for (const entry of opts.skipped) {
      lines.push(`  - ${entry.name} ${muted(entry.destDir)}`);
    }
  }

  lines.push('');
  lines.push(`Skills directory: ${opts.skillsDir}`);
  lines.push("Warning: installed skills run with the agent's full permissions.");
  lines.push('Done!');
  return lines.join('\n');
}
