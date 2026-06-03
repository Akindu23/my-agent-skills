import { describe, expect, it } from 'vitest';
import {
  buildListSummaryRows,
  renderListSummary,
} from '../../src/lib/list-summary.js';
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

describe('list-summary', () => {
  it('renders installed skills table with lockfile header and deps', () => {
    const rows = buildListSummaryRows(
      [
        {
          name: 'alpha',
          linkType: 'symlink',
          hashPrefix: 'abcd1234',
          exists: true,
          healthy: true,
        },
        {
          name: 'beta',
          linkType: 'symlink',
          hashPrefix: 'efgh5678',
          exists: true,
          healthy: true,
        },
      ],
      miniBundle,
    );

    const body = stripAnsi(
      renderListSummary({
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

    expect(body).toContain('Lockfile: /proj/.agents/cursor-skills-lock.json');
    expect(body).toContain('STATUS   NAME');
    expect(body).toContain('ok       alpha');
    expect(body).toMatch(/beta\s+symlink\s+efgh5678\s+alpha/);
  });
});
