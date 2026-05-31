import { describe, expect, it } from 'vitest';
import { planProceedMessage } from '../../src/lib/prompts.js';
import type { InstallPlan } from '../../src/lib/install-plan.js';

function entry(action: InstallPlan['entries'][number]['action']): InstallPlan['entries'][number] {
  return {
    name: 'alpha',
    sourceDir: '/src/alpha',
    destDir: '/dest/alpha',
    computedHash: 'hash',
    action,
    linkType: 'symlink',
  };
}

function planWithActions(...actions: InstallPlan['entries'][number]['action'][]): InstallPlan {
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
    entries: actions.map(entry),
  };
}

describe('planProceedMessage', () => {
  it('returns null when all entries are skip', () => {
    expect(planProceedMessage(planWithActions('skip'))).toBeNull();
  });

  it('asks to overwrite when only confirm entries apply', () => {
    expect(planProceedMessage(planWithActions('confirm'))).toBe(
      'Overwrite 1 skill(s) with bundle content?',
    );
  });

  it('combines install and overwrite when mixed', () => {
    expect(planProceedMessage(planWithActions('new', 'confirm'))).toBe(
      'Install 1 skill(s) and overwrite 1 with bundle content?',
    );
  });

  it('uses default install message for new/update only', () => {
    expect(planProceedMessage(planWithActions('new', 'update'))).toBe(
      'Proceed with installation?',
    );
  });
});
