import { describe, expect, it } from 'vitest';
import { renderInstallSummary } from '../../src/lib/install-summary.js';
import type { InstallPlan } from '../../src/lib/install-plan.js';

function minimalPlan(
  entries: InstallPlan['entries'],
  overrides?: Pick<InstallPlan, 'selected' | 'ordered' | 'dependencyCount'>,
): InstallPlan {
  const selected = overrides?.selected ?? entries.map((e) => e.name);
  const ordered = overrides?.ordered ?? selected;
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
    selected,
    ordered,
    dependencyCount: overrides?.dependencyCount ?? 0,
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

  it('lists each skill when at detail threshold', () => {
    const entries = ['a', 'b'].map((name) => ({
      name,
      sourceDir: `/src/${name}`,
      destDir: `/dest/${name}`,
      computedHash: 'hash',
      action: 'new' as const,
      linkType: 'symlink' as const,
    }));
    const summary = renderInstallSummary(
      minimalPlan(entries, { selected: ['a', 'b'], ordered: ['a', 'b'] }),
    );

    expect(summary).toContain('new      a');
    expect(summary).toContain('Selected: a, b');
  });

  it('lists every selected name and skill row for large selections', () => {
    const names = Array.from({ length: 6 }, (_, i) => `skill-${i}`);
    const entries = names.map((name) => ({
      name,
      sourceDir: `/src/${name}`,
      destDir: `/dest/${name}`,
      computedHash: 'hash',
      action: 'new' as const,
      linkType: 'symlink' as const,
    }));
    const summary = renderInstallSummary(
      minimalPlan(entries, { selected: names, ordered: names }),
    );

    expect(summary).toContain('Selected (6):');
    expect(summary).toContain('  skill-0');
    expect(summary).toContain('  skill-5');
    expect(summary).toContain('new      skill-0');
    expect(summary).not.toMatch(/Selected: skill-0, skill-1/);
  });
});
