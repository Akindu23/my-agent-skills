import { describe, expect, it } from 'vitest';
import { renderInstallSummary } from '../../src/lib/install-summary.js';
import type { InstallPlan } from '../../src/lib/install-plan.js';

function minimalPlan(entries: InstallPlan['entries']): InstallPlan {
  return {
    bundle: {
      root: '/tmp/skills',
      manifest: {
        schema_version: 1,
        name: 'test',
        version: '1.0.0',
        skills: ['alpha'],
        dependsOn: {},
      },
      packageName: 'test',
      packageVersion: '1.0.0',
    },
    scope: {
      scope: 'project',
      cwd: '/tmp',
      agentsDir: '/tmp/.agents',
      skillsDir: '/tmp/.agents/skills',
      lockPath: '/tmp/.agents/cursor-skills.lock',
    },
    selected: ['alpha'],
    ordered: ['alpha'],
    dependencyCount: 0,
    linkType: 'symlink',
    lock: {
      version: 1,
      package: { name: 'test', version: '1.0.0' },
      skills: {},
    },
    entries,
  };
}

describe('renderInstallSummary', () => {
  it('labels confirm actions as reinstall', () => {
    const summary = renderInstallSummary(
      minimalPlan([
        {
          name: 'alpha',
          sourceDir: '/src/alpha',
          destDir: '/dest/alpha',
          computedHash: 'hash',
          action: 'confirm',
          linkType: 'symlink',
        },
      ]),
    );

    expect(summary).toContain('reinstall alpha');
    expect(summary).toContain('Bundle content changed for 1 skill(s)');
  });
});
