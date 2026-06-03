import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyInstallPlan } from '../../src/lib/apply-install-plan.js';
import type { InstallPlan } from '../../src/lib/install-plan.js';
import { emptyLockfile } from '../../src/lib/lockfile.js';

const tmpDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
  vi.restoreAllMocks();
});

function minimalPlan(scopeDir: string): InstallPlan {
  const agentsDir = path.join(scopeDir, '.agents');
  const skillsDir = path.join(agentsDir, 'skills');
  return {
    bundle: {
      root: '/bundle',
      manifest: {
        schema_version: 1,
        name: 'test',
        version: '1.0.0',
        skills: [],
        dependsOn: {},
      },
      packageName: 'test',
      packageVersion: '1.0.0',
      githubSource: 'Akindu23/my-agent-skills',
      commit: 'local',
      cacheRoot: '/cache',
    },
    scope: {
      scope: 'project',
      cwd: scopeDir,
      agentsDir,
      skillsDir,
      lockPath: path.join(agentsDir, 'cursor-skills-lock.json'),
    },
    selected: ['alpha', 'beta'],
    ordered: ['alpha', 'beta'],
    dependencyCount: 0,
    linkType: 'copy',
    lock: emptyLockfile({
      source: 'Akindu23/my-agent-skills',
      commit: 'local',
      package: { name: 'test', version: '1.0.0' },
    }),
    entries: [
      {
        name: 'alpha',
        sourceDir: '/bundle/alpha',
        destDir: path.join(skillsDir, 'alpha'),
        computedHash: 'a'.repeat(64),
        action: 'new',
        linkType: 'copy',
      },
      {
        name: 'beta',
        sourceDir: '/bundle/beta',
        destDir: path.join(skillsDir, 'beta'),
        computedHash: 'b'.repeat(64),
        action: 'new',
        linkType: 'copy',
      },
    ],
  };
}

describe('applyInstallPlan', () => {
  it('does not write lock when materialize fails mid-loop', async () => {
    const scopeDir = await mkdtemp(path.join(os.tmpdir(), 'cas-apply-'));
    tmpDirs.push(scopeDir);
    const plan = minimalPlan(scopeDir);

    const install = await import('../../src/lib/install.js');
    vi.spyOn(install, 'materializeSkill')
      .mockResolvedValueOnce('copy')
      .mockRejectedValueOnce(new Error('disk full'));

    await expect(applyInstallPlan(plan, { copy: true })).rejects.toThrow('disk full');

    const raw = await readFile(plan.scope.lockPath, 'utf8').catch((err: NodeJS.ErrnoException) => {
      expect(err.code).toBe('ENOENT');
      return null;
    });
    expect(raw).toBeNull();
    expect(plan.lock.skills.alpha).toBeUndefined();
  });
});
