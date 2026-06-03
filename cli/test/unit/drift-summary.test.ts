import { describe, expect, it } from 'vitest';
import { DEFAULT_GITHUB_SOURCE } from '../../src/lib/constants.js';
import { renderDriftSummary } from '../../src/lib/drift-summary.js';
import type { DriftPlan } from '../../src/lib/drift-plan.js';
import { stripAnsi } from '../../src/lib/theme.js';

const basePlan: DriftPlan = {
  bundle: {
    root: '/bundle',
    manifest: {
      schema_version: 1,
      name: 'bundle-mini',
      version: '0.0.0',
      skills: ['skills/alpha'],
      dependsOn: {},
    },
    packageName: 'bundle-mini',
    packageVersion: '0.1.0',
    githubSource: DEFAULT_GITHUB_SOURCE,
    commit: 'abc1234',
    cacheRoot: '/cache',
  },
  scope: {
    scope: 'project',
    agentsDir: '/proj/.agents',
    skillsDir: '/proj/.agents/skills',
    lockPath: '/proj/.agents/cursor-skills-lock.json',
    cwd: '/proj',
  },
  lock: {
    version: 2,
    source: DEFAULT_GITHUB_SOURCE,
    sourceType: 'github',
    commit: 'abc1234',
    skills: {
      alpha: {
        source: DEFAULT_GITHUB_SOURCE,
        sourceType: 'github',
        computedHash: 'abc',
        linkType: 'symlink',
        installedAt: '2020-01-01T00:00:00.000Z',
        updatedAt: '2020-01-01T00:00:00.000Z',
      },
    },
    package: { name: 'bundle-mini', version: '0.1.0' },
  },
  commitDrift: false,
  manifestDrift: false,
  entries: [{ name: 'alpha', status: 'ok' }],
};

describe('renderDriftSummary', () => {
  it('renders check mode header, counts, and skill status rows', () => {
    const body = stripAnsi(renderDriftSummary(basePlan, { mode: 'check' }));

    expect(body).toContain('Pack: bundle-mini v0.1.0');
    expect(body).toContain('Scope: project');
    expect(body).toContain('Lockfile: /proj/.agents/cursor-skills-lock.json');
    expect(body).toContain('Manifest: in sync');
    expect(body).toContain('Remote: pinned at abc1234');
    expect(body).toContain('In sync: 1  Drift: 0  Orphans: 0');
    expect(body).toContain('ok       alpha');
  });

  it('shows drift and orphan counts in check mode', () => {
    const body = stripAnsi(
      renderDriftSummary(
        {
          ...basePlan,
          manifestDrift: true,
          entries: [
            { name: 'alpha', status: 'hashDrift' },
            { name: 'ghost', status: 'orphan' },
          ],
        },
        { mode: 'check' },
      ),
    );

    expect(body).toContain('Manifest: version drift');
    expect(body).toContain('In sync: 0  Drift: 1  Orphans: 1');
    expect(body).toContain('drift    alpha');
    expect(body).toContain('orphan   ghost');
  });

  it('uses update labels in update mode', () => {
    const body = stripAnsi(
      renderDriftSummary(
        {
          ...basePlan,
          entries: [{ name: 'alpha', status: 'hashDrift' }],
        },
        { mode: 'update' },
      ),
    );

    expect(body).toContain('To refresh: 1');
    expect(body).toContain('update   alpha');
  });
});
