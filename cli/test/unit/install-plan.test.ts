import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveBundle } from '../../src/lib/bundle.js';
import { computeSkillFolderHash } from '../../src/lib/hash.js';
import { createInstallPlan } from '../../src/lib/install-plan.js';
import type { ScopePaths } from '../../src/lib/scope.js';

const cliRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const bundleMini = path.join(cliRoot, 'test/fixtures/bundle-mini/skills');
const tmpDirs: string[] = [];

async function tempScope(): Promise<ScopePaths> {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'cas-plan-'));
  tmpDirs.push(cwd);
  const agentsDir = path.join(cwd, '.agents');
  return {
    scope: 'project',
    cwd,
    agentsDir,
    skillsDir: path.join(agentsDir, 'skills'),
    lockPath: path.join(agentsDir, 'cursor-skills-lock.json'),
  };
}

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

describe('createInstallPlan', () => {
  it('expands dependencies and classifies new symlink installs without writing', async () => {
    const scope = await tempScope();
    const bundle = await resolveBundle({ source: bundleMini });

    const plan = await createInstallPlan({
      bundle,
      selected: ['beta'],
      scope,
    });

    expect(plan.ordered).toEqual(['alpha', 'beta']);
    expect(plan.dependencyCount).toBe(1);
    expect(plan.linkType).toBe('symlink');
    expect(plan.entries.map((entry) => [entry.name, entry.action, entry.dependencyOf])).toEqual([
      ['alpha', 'new', 'beta'],
      ['beta', 'new', undefined],
    ]);
  });

  it('classifies matching locked installs as skip', async () => {
    const scope = await tempScope();
    const alphaSource = path.join(bundleMini, 'alpha');
    const alphaDest = path.join(scope.skillsDir, 'alpha');
    await mkdir(scope.skillsDir, { recursive: true });
    await symlink(alphaSource, alphaDest, 'dir');
    const hash = await computeSkillFolderHash(alphaSource);
    await writeFile(scope.lockPath, JSON.stringify({
      version: 1,
      package: { name: 'bundle-mini', version: '0.0.0' },
      skills: {
        alpha: {
          source: 'bundle-mini',
          sourceType: 'bundled',
          computedHash: hash,
          linkType: 'symlink',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    }));

    const bundle = await resolveBundle({ source: bundleMini });
    const plan = await createInstallPlan({
      bundle,
      selected: ['alpha'],
      scope,
      copy: true,
    });

    expect(plan.linkType).toBe('copy');
    expect(plan.entries).toMatchObject([
      { name: 'alpha', action: 'skip', linkType: 'copy' },
    ]);
  });

  it('classifies tracked hash drift as confirm when install is healthy', async () => {
    const scope = await tempScope();
    const alphaSource = path.join(bundleMini, 'alpha');
    const alphaDest = path.join(scope.skillsDir, 'alpha');
    await mkdir(scope.skillsDir, { recursive: true });
    await symlink(alphaSource, alphaDest, 'dir');
    await writeFile(scope.lockPath, JSON.stringify({
      version: 1,
      package: { name: 'bundle-mini', version: '0.0.0' },
      skills: {
        alpha: {
          source: 'bundle-mini',
          sourceType: 'bundled',
          computedHash: 'old-hash',
          linkType: 'symlink',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    }));

    const bundle = await resolveBundle({ source: bundleMini });
    const plan = await createInstallPlan({
      bundle,
      selected: ['alpha'],
      scope,
    });

    expect(plan.entries).toMatchObject([
      { name: 'alpha', action: 'confirm' },
    ]);
  });

  it('classifies broken symlink with lock entry as update', async () => {
    const scope = await tempScope();
    const alphaSource = path.join(bundleMini, 'alpha');
    const alphaDest = path.join(scope.skillsDir, 'alpha');
    await mkdir(scope.skillsDir, { recursive: true });
    await symlink(path.join(bundleMini, 'missing-target'), alphaDest, 'dir');
    const hash = await computeSkillFolderHash(alphaSource);
    await writeFile(scope.lockPath, JSON.stringify({
      version: 1,
      package: { name: 'bundle-mini', version: '0.0.0' },
      skills: {
        alpha: {
          source: 'bundle-mini',
          sourceType: 'bundled',
          computedHash: hash,
          linkType: 'symlink',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    }));

    const bundle = await resolveBundle({ source: bundleMini });
    const plan = await createInstallPlan({
      bundle,
      selected: ['alpha'],
      scope,
    });

    expect(plan.entries).toMatchObject([
      { name: 'alpha', action: 'update' },
    ]);
  });
});
