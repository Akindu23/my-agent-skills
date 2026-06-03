import { describe, expect, it } from 'vitest';
import {
  buildSyncSummaryRows,
  depsLabelForSkill,
  renderSyncSummary,
} from '../../src/lib/sync-summary.js';
import type { BundleContext } from '../../src/lib/bundle.js';
import { stripAnsi } from '../../src/lib/theme.js';

const miniBundle: BundleContext = {
  root: '/bundle',
  manifest: {
    schema_version: 1,
    name: 'bundle-mini',
    version: '0.0.0',
    skills: ['skills/alpha', 'skills/beta'],
    dependsOn: { beta: ['alpha'] },
  },
  packageName: 'cursor-agent-skills',
  packageVersion: '0.0.0',
};

describe('sync-summary', () => {
  it('renders header, counts, and synced/ok rows with deps', () => {
    const rows = buildSyncSummaryRows(['alpha', 'beta'], ['beta'], miniBundle);
    const body = stripAnsi(
      renderSyncSummary({
        scope: {
          scope: 'project',
          agentsDir: '/proj/.agents',
          skillsDir: '/proj/.agents/skills',
          lockPath: '/proj/.agents/cursor-skills-lock.json',
          cwd: '/proj',
        },
        bundle: miniBundle,
        rows,
      }),
    );

    expect(body).toContain('Pack: bundle-mini v0.0.0');
    expect(body).toContain('Scope: project');
    expect(body).toContain('Destination: /proj/.agents/skills');
    expect(body).toContain('Synced: 1  Up to date: 1');
    expect(body).toContain('synced beta');
    expect(body).toContain('ok     alpha');
    expect(body).toMatch(/beta\s+alpha/);
  });

  it('uses em dash when bundle has no dependsOn entry', () => {
    expect(depsLabelForSkill(miniBundle, 'alpha')).toBe('—');
  });
});
