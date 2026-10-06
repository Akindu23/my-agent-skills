import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyDriftPlan, planInstalls } from '../../src/lib/apply-drift-plan.js';
import type { DriftPlan } from '../../src/lib/drift-plan.js';
import { resolveBundle } from '../../src/lib/bundle.js';
import { planDriftFromBundles } from '../../src/lib/drift-plan.js';
import { computeSkillFolderHash } from '../../src/lib/hash.js';
import { readLockfile, LOCK_VERSION } from '../../src/lib/lockfile.js';
import * as remotePack from '../../src/lib/remote-pack.js';
import type { ScopePaths } from '../../src/lib/scope.js';
import { DEFAULT_GITHUB_SOURCE } from '../../src/lib/constants.js';

const cliRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const bundleMini = path.join(cliRoot, 'test/fixtures/bundle-mini/skills');
const bundleMiniV2 = path.join(cliRoot, 'test/fixtures/bundle-mini-v2/skills');
const bundleMiniV3 = path.join(cliRoot, 'test/fixtures/bundle-mini-v3/skills');
const tmpDirs: string[] = [];

async function tempScope(): Promise<ScopePaths> {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'cas-apply-drift-'));
  tmpDirs.push(cwd);
  const agentsDir = path.join(cwd, '.agents');
  const skillsDir = path.join(agentsDir, 'skills');
  await mkdir(skillsDir, { recursive: true });
  return {
    scope: 'project',
    cwd,
    agentsDir,
    skillsDir,
    lockPath: path.join(agentsDir, 'cursor-skills-lock.json'),
  };
}

/** Resolve the install set from the chosen names, then apply, as runUpdate does. */
async function applyChoices(
  plan: DriftPlan,
  opts: {
    orphansToRemove: ReadonlySet<string>;
    dependenciesToInstall: ReadonlySet<string>;
    newSkillsToInstall: ReadonlySet<string>;
  },
) {
  const installs = await planInstalls(plan, opts);
  const result = await applyDriftPlan(plan, { orphansToRemove: opts.orphansToRemove, installs: installs.items });
  return { ...result, unmanaged: installs.unmanaged };
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(tmpDirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

describe('applyDriftPlan commit advance', () => {
  it('relinks all skills, advances lock commit, and prunes cache', async () => {
    const scope = await tempScope();
    const pinBundle = await resolveBundle({ source: bundleMini });
    const remoteBundle = await resolveBundle({ source: bundleMiniV2 });
    const alphaPinHash = await computeSkillFolderHash(path.join(bundleMini, 'alpha'));
    const betaHash = await computeSkillFolderHash(path.join(bundleMini, 'beta'));

    await symlink(path.join(bundleMini, 'alpha'), path.join(scope.skillsDir, 'alpha'), 'dir');
    await symlink(path.join(bundleMini, 'beta'), path.join(scope.skillsDir, 'beta'), 'dir');

    const lockBody = {
      version: LOCK_VERSION,
      source: DEFAULT_GITHUB_SOURCE,
      sourceType: 'github',
      commit: 'pin-old-sha',
      defaultLinkType: 'symlink',
      package: { name: 'bundle-mini', version: '0.0.0' },
      skills: {
        alpha: {
          source: DEFAULT_GITHUB_SOURCE,
          sourceType: 'github',
          computedHash: alphaPinHash,
          linkType: 'symlink',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        beta: {
          source: DEFAULT_GITHUB_SOURCE,
          sourceType: 'github',
          computedHash: betaHash,
          linkType: 'symlink',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    };
    await writeFile(scope.lockPath, JSON.stringify(lockBody));

    const lock = (await readLockfile(scope.lockPath))!;
    const plan = await planDriftFromBundles({
      scope,
      lock,
      bundle: pinBundle,
      remoteBundle,
      commitDrift: true,
      remoteCommit: remoteBundle.commit,
    });

    const pruneSpy = vi.spyOn(remotePack, 'pruneCommitCache').mockResolvedValue(undefined);

    const result = await applyChoices(plan, {
      orphansToRemove: new Set(),
      dependenciesToInstall: new Set(),
      newSkillsToInstall: new Set(),
    });

    expect(result.updated).toEqual(['alpha', 'beta']);
    expect(result.contentChanged).toEqual(['alpha']);

    const after = await readLockfile(scope.lockPath);
    expect(after?.commit).toBe(remoteBundle.commit);
    const alphaRemoteHash = await computeSkillFolderHash(path.join(bundleMiniV2, 'alpha'));
    expect(after?.skills.alpha?.computedHash).toBe(alphaRemoteHash);
    expect(pruneSpy).toHaveBeenCalledWith(DEFAULT_GITHUB_SOURCE, 'pin-old-sha');
  });

  it('does not write lock or prune when a second target fails', async () => {
    const scope = await tempScope();
    const pinBundle = await resolveBundle({ source: bundleMini });
    const remoteBundle = await resolveBundle({ source: bundleMiniV2 });
    const alphaPinHash = await computeSkillFolderHash(path.join(bundleMini, 'alpha'));

    await mkdir(path.join(scope.cwd, '.claude', 'skills'), { recursive: true });
    await symlink(path.join(bundleMini, 'alpha'), path.join(scope.skillsDir, 'alpha'), 'dir');
    await symlink(
      path.join(bundleMini, 'alpha'),
      path.join(scope.cwd, '.claude', 'skills', 'alpha'),
      'dir',
    );

    const lockBody = {
      version: LOCK_VERSION,
      source: DEFAULT_GITHUB_SOURCE,
      sourceType: 'github',
      commit: 'pin-old-sha',
      defaultLinkType: 'symlink',
      targets: ['claude', 'cursor'],
      package: { name: 'bundle-mini', version: '0.0.0' },
      skills: {
        alpha: {
          source: DEFAULT_GITHUB_SOURCE,
          sourceType: 'github',
          computedHash: alphaPinHash,
          linkType: 'symlink',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    };
    await writeFile(scope.lockPath, JSON.stringify(lockBody));
    const lockBefore = await readFile(scope.lockPath, 'utf8');

    const lock = (await readLockfile(scope.lockPath))!;
    const plan = await planDriftFromBundles({
      scope,
      lock,
      bundle: pinBundle,
      remoteBundle,
      commitDrift: true,
      remoteCommit: remoteBundle.commit,
    });

    const install = await import('../../src/lib/install.js');
    vi.spyOn(install, 'materializeFromLockEntry')
      .mockResolvedValueOnce('symlink')
      .mockRejectedValueOnce(new Error('second target fail'));
    const pruneSpy = vi.spyOn(remotePack, 'pruneCommitCache').mockResolvedValue(undefined);

    await expect(
      applyChoices(plan, {
        orphansToRemove: new Set(),
        dependenciesToInstall: new Set(),
        newSkillsToInstall: new Set(),
      }),
    ).rejects.toThrow('Update failed');

    expect(await readFile(scope.lockPath, 'utf8')).toBe(lockBefore);
    expect(pruneSpy).not.toHaveBeenCalled();
  });
});

describe('applyDriftPlan orphan handling', () => {
  it('removes selected orphans from disk and lockfile', async () => {
    const scope = await tempScope();
    const bundle = await resolveBundle({ source: bundleMini });
    const alphaHash = await computeSkillFolderHash(path.join(bundleMini, 'alpha'));
    const ghostDir = path.join(scope.skillsDir, 'ghost');

    await symlink(path.join(bundleMini, 'alpha'), path.join(scope.skillsDir, 'alpha'), 'dir');
    await mkdir(ghostDir, { recursive: true });
    await writeFile(scope.lockPath, JSON.stringify({
      version: LOCK_VERSION,
      source: DEFAULT_GITHUB_SOURCE,
      sourceType: 'github',
      commit: bundle.commit,
      defaultLinkType: 'symlink',
      package: { name: 'bundle-mini', version: '0.0.0' },
      skills: {
        alpha: {
          source: DEFAULT_GITHUB_SOURCE,
          sourceType: 'github',
          computedHash: alphaHash,
          linkType: 'symlink',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        ghost: {
          source: DEFAULT_GITHUB_SOURCE,
          sourceType: 'github',
          computedHash: 'deadbeef',
          linkType: 'symlink',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    }));

    const lock = (await readLockfile(scope.lockPath))!;
    const plan = await planDriftFromBundles({
      scope,
      lock,
      bundle,
      commitDrift: false,
    });

    const result = await applyChoices(plan, {
      orphansToRemove: new Set(['ghost']),
      dependenciesToInstall: new Set(),
      newSkillsToInstall: new Set(),
    });

    expect(result.orphansRemoved).toEqual(['ghost']);
    expect(result.orphansSkipped).toEqual([]);
    const after = await readLockfile(scope.lockPath);
    expect(after?.skills.ghost).toBeUndefined();
    await expect(readFile(ghostDir, 'utf8')).rejects.toThrow();
  });

  it('skips unselected orphans without writing the lockfile', async () => {
    const scope = await tempScope();
    const bundle = await resolveBundle({ source: bundleMini });
    const alphaHash = await computeSkillFolderHash(path.join(bundleMini, 'alpha'));
    const lockBody = {
      version: LOCK_VERSION,
      source: DEFAULT_GITHUB_SOURCE,
      sourceType: 'github',
      commit: bundle.commit,
      defaultLinkType: 'symlink',
      package: { name: 'bundle-mini', version: '0.0.0' },
      skills: {
        alpha: {
          source: DEFAULT_GITHUB_SOURCE,
          sourceType: 'github',
          computedHash: alphaHash,
          linkType: 'symlink',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        ghost: {
          source: DEFAULT_GITHUB_SOURCE,
          sourceType: 'github',
          computedHash: 'deadbeef',
          linkType: 'symlink',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    };
    await writeFile(scope.lockPath, JSON.stringify(lockBody, null, 2));

    const lock = (await readLockfile(scope.lockPath))!;
    const plan = await planDriftFromBundles({
      scope,
      lock,
      bundle,
      commitDrift: false,
    });

    const result = await applyChoices(plan, {
      orphansToRemove: new Set(),
      dependenciesToInstall: new Set(),
      newSkillsToInstall: new Set(),
    });

    expect(result.orphansRemoved).toEqual([]);
    expect(result.orphansSkipped).toEqual(['ghost']);
    const after = JSON.parse(await readFile(scope.lockPath, 'utf8'));
    expect(after.skills.ghost).toBeDefined();
  });
});

describe('applyDriftPlan missing dependency handling', () => {
  // bundle-mini's manifest declares dependsOn.beta = ["alpha"].
  async function planWithMissingAlpha(scope: ScopePaths) {
    const bundle = await resolveBundle({ source: bundleMini });
    const betaHash = await computeSkillFolderHash(path.join(bundleMini, 'beta'));
    await symlink(path.join(bundleMini, 'beta'), path.join(scope.skillsDir, 'beta'), 'dir');
    await writeFile(scope.lockPath, JSON.stringify({
      version: LOCK_VERSION,
      source: DEFAULT_GITHUB_SOURCE,
      sourceType: 'github',
      commit: bundle.commit,
      defaultLinkType: 'symlink',
      package: { name: 'bundle-mini', version: bundle.packageVersion },
      skills: {
        beta: {
          source: DEFAULT_GITHUB_SOURCE,
          sourceType: 'github',
          computedHash: betaHash,
          linkType: 'symlink',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    }));
    const lock = (await readLockfile(scope.lockPath))!;
    const plan = await planDriftFromBundles({ scope, lock, bundle, commitDrift: false });
    return plan;
  }

  it('materializes an accepted missing dependency and adds it to the lock', async () => {
    const scope = await tempScope();
    const plan = await planWithMissingAlpha(scope);

    const result = await applyChoices(plan, {
      orphansToRemove: new Set(),
      dependenciesToInstall: new Set(['alpha']),
      newSkillsToInstall: new Set(),
    });

    expect(result.dependenciesAdded).toEqual(['alpha']);
    expect(result.dependenciesSkipped).toEqual([]);
    const after = await readLockfile(scope.lockPath);
    expect(after?.skills.alpha).toBeDefined();
    const target = await readFile(path.join(scope.skillsDir, 'alpha', 'SKILL.md'), 'utf8').catch(
      () => null,
    );
    expect(target).not.toBeNull();
  });

  it('skips a declined missing dependency without writing it to the lock', async () => {
    const scope = await tempScope();
    const plan = await planWithMissingAlpha(scope);

    const result = await applyChoices(plan, {
      orphansToRemove: new Set(),
      dependenciesToInstall: new Set(),
      newSkillsToInstall: new Set(),
    });

    expect(result.dependenciesAdded).toEqual([]);
    expect(result.dependenciesSkipped).toEqual(['alpha']);
    const after = await readLockfile(scope.lockPath);
    expect(after?.skills.alpha).toBeUndefined();
  });

  it('rolls back a materialized dep and leaves the lock unchanged when a later target fails', async () => {
    const scope = await tempScope();
    await mkdir(path.join(scope.cwd, '.claude', 'skills'), { recursive: true });
    const bundle = await resolveBundle({ source: bundleMini });
    const betaHash = await computeSkillFolderHash(path.join(bundleMini, 'beta'));
    await symlink(path.join(bundleMini, 'beta'), path.join(scope.skillsDir, 'beta'), 'dir');
    await symlink(
      path.join(bundleMini, 'beta'),
      path.join(scope.cwd, '.claude', 'skills', 'beta'),
      'dir',
    );
    await writeFile(scope.lockPath, JSON.stringify({
      version: LOCK_VERSION,
      source: DEFAULT_GITHUB_SOURCE,
      sourceType: 'github',
      commit: bundle.commit,
      defaultLinkType: 'symlink',
      targets: ['claude', 'cursor'],
      package: { name: 'bundle-mini', version: bundle.packageVersion },
      skills: {
        beta: {
          source: DEFAULT_GITHUB_SOURCE,
          sourceType: 'github',
          computedHash: betaHash,
          linkType: 'symlink',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    }));
    const lockBefore = await readFile(scope.lockPath, 'utf8');

    const lock = (await readLockfile(scope.lockPath))!;
    const plan = await planDriftFromBundles({ scope, lock, bundle, commitDrift: false });

    // First target for alpha materializes for real, second target fails mid-apply.
    const install = await import('../../src/lib/install.js');
    const realMaterialize = install.materializeFromLockEntry;
    vi.spyOn(install, 'materializeFromLockEntry')
      .mockImplementationOnce(realMaterialize)
      .mockRejectedValueOnce(new Error('second target fail'));

    await expect(
      applyChoices(plan, {
        orphansToRemove: new Set(),
        dependenciesToInstall: new Set(['alpha']),
        newSkillsToInstall: new Set(),
      }),
    ).rejects.toThrow('Update failed');

    // Lock is untouched: alpha never recorded.
    expect(await readFile(scope.lockPath, 'utf8')).toBe(lockBefore);
    const after = await readLockfile(scope.lockPath);
    expect(after?.skills.alpha).toBeUndefined();

    // The dep dir created before the failure is rolled back under each target.
    for (const dir of [scope.skillsDir, path.join(scope.cwd, '.claude', 'skills')]) {
      await expect(readFile(path.join(dir, 'alpha', 'SKILL.md'), 'utf8')).rejects.toThrow();
    }
  });

  it('advances the commit and adds a missing dependency without crashing', async () => {
    const scope = await tempScope();
    const pinBundle = await resolveBundle({ source: bundleMini });
    const remoteBundle = await resolveBundle({ source: bundleMiniV2 });
    const betaHash = await computeSkillFolderHash(path.join(bundleMini, 'beta'));
    await symlink(path.join(bundleMini, 'beta'), path.join(scope.skillsDir, 'beta'), 'dir');
    await writeFile(scope.lockPath, JSON.stringify({
      version: LOCK_VERSION,
      source: DEFAULT_GITHUB_SOURCE,
      sourceType: 'github',
      commit: 'pin-old-sha',
      defaultLinkType: 'symlink',
      package: { name: 'bundle-mini', version: pinBundle.packageVersion },
      skills: {
        beta: {
          source: DEFAULT_GITHUB_SOURCE,
          sourceType: 'github',
          computedHash: betaHash,
          linkType: 'symlink',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    }));

    const lock = (await readLockfile(scope.lockPath))!;
    const plan = await planDriftFromBundles({
      scope,
      lock,
      bundle: pinBundle,
      remoteBundle,
      commitDrift: true,
      remoteCommit: remoteBundle.commit,
    });

    const pruneSpy = vi.spyOn(remotePack, 'pruneCommitCache').mockResolvedValue(undefined);

    const result = await applyChoices(plan, {
      orphansToRemove: new Set(),
      dependenciesToInstall: new Set(['alpha']),
      newSkillsToInstall: new Set(),
    });

    expect(result.updated).toEqual(['beta']);
    expect(result.dependenciesAdded).toEqual(['alpha']);
    const after = await readLockfile(scope.lockPath);
    expect(after?.commit).toBe(remoteBundle.commit);
    expect(after?.skills.alpha).toBeDefined();
    expect(pruneSpy).toHaveBeenCalledWith(DEFAULT_GITHUB_SOURCE, 'pin-old-sha');
  });
});

describe('applyDriftPlan new pack skills', () => {
  async function planAlphaOnlyAgainstV3(scope: ScopePaths) {
    const pinBundle = await resolveBundle({ source: bundleMini });
    const remoteBundle = await resolveBundle({ source: bundleMiniV3 });
    const alphaHash = await computeSkillFolderHash(path.join(bundleMini, 'alpha'));
    await symlink(path.join(bundleMini, 'alpha'), path.join(scope.skillsDir, 'alpha'), 'dir');
    await writeFile(scope.lockPath, JSON.stringify({
      version: LOCK_VERSION,
      source: DEFAULT_GITHUB_SOURCE,
      sourceType: 'github',
      commit: 'pin-old-sha',
      defaultLinkType: 'symlink',
      package: { name: 'bundle-mini', version: pinBundle.packageVersion },
      skills: {
        alpha: {
          source: DEFAULT_GITHUB_SOURCE,
          sourceType: 'github',
          computedHash: alphaHash,
          linkType: 'symlink',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    }));
    const lock = (await readLockfile(scope.lockPath))!;
    vi.spyOn(remotePack, 'pruneCommitCache').mockResolvedValue(undefined);
    return planDriftFromBundles({
      scope,
      lock,
      bundle: pinBundle,
      remoteBundle,
      commitDrift: true,
      remoteCommit: remoteBundle.commit,
    });
  }

  it('installs a chosen new skill plus every unlocked dependency it needs', async () => {
    const scope = await tempScope();
    const plan = await planAlphaOnlyAgainstV3(scope);

    const result = await applyChoices(plan, {
      orphansToRemove: new Set(),
      dependenciesToInstall: new Set(),
      newSkillsToInstall: new Set(['gamma']),
    });

    expect(result.updated).toEqual(['alpha']);
    expect(result.newSkillsAdded).toEqual(['gamma']);
    // delta is new but unticked; beta predates the pin but was never added.
    expect(result.dependenciesAdded).toEqual(['delta', 'beta']);
    expect(result.requiredBy).toEqual({ delta: 'gamma', beta: 'gamma' });
    expect(result.newSkillsSkipped).toEqual([]);
    const after = await readLockfile(scope.lockPath);
    expect(Object.keys(after!.skills).sort()).toEqual(['alpha', 'beta', 'delta', 'gamma']);
    expect(after?.commit).toBe(plan.remoteBundle!.commit);
  });

  it('skips declined new skills and leaves them out of the lock', async () => {
    const scope = await tempScope();
    const plan = await planAlphaOnlyAgainstV3(scope);

    const result = await applyChoices(plan, {
      orphansToRemove: new Set(),
      dependenciesToInstall: new Set(),
      newSkillsToInstall: new Set(),
    });

    expect(result.newSkillsAdded).toEqual([]);
    expect(result.newSkillsSkipped).toEqual(['delta', 'gamma']);
    const after = await readLockfile(scope.lockPath);
    expect(Object.keys(after!.skills)).toEqual(['alpha']);
  });

  it('leaves an unmanaged dir with a new skill name untouched and skips that skill', async () => {
    const scope = await tempScope();
    const plan = await planAlphaOnlyAgainstV3(scope);
    const foreign = path.join(scope.skillsDir, 'gamma');
    await mkdir(foreign, { recursive: true });
    await writeFile(path.join(foreign, 'KEEP.md'), 'not ours');

    const result = await applyChoices(plan, {
      orphansToRemove: new Set(),
      dependenciesToInstall: new Set(),
      newSkillsToInstall: new Set(['gamma']),
    });

    expect(result.unmanaged).toEqual(['gamma']);
    expect(result.newSkillsAdded).toEqual([]);
    expect(result.dependenciesAdded).toEqual([]);
    expect(result.newSkillsSkipped).toEqual(['delta', 'gamma']);
    expect(await readFile(path.join(foreign, 'KEEP.md'), 'utf8')).toBe('not ours');
    const after = await readLockfile(scope.lockPath);
    expect(Object.keys(after!.skills)).toEqual(['alpha']);
  });

  it('skips an unmanaged dependency dir but still installs the chosen skill', async () => {
    const scope = await tempScope();
    const plan = await planAlphaOnlyAgainstV3(scope);
    const foreign = path.join(scope.skillsDir, 'beta');
    await mkdir(foreign, { recursive: true });
    await writeFile(path.join(foreign, 'KEEP.md'), 'not ours');

    const result = await applyChoices(plan, {
      orphansToRemove: new Set(),
      dependenciesToInstall: new Set(),
      newSkillsToInstall: new Set(['gamma']),
    });

    expect(result.unmanaged).toEqual(['beta']);
    expect(result.newSkillsAdded).toEqual(['gamma']);
    expect(result.dependenciesAdded).toEqual(['delta']);
    expect(await readFile(path.join(foreign, 'KEEP.md'), 'utf8')).toBe('not ours');
    const after = await readLockfile(scope.lockPath);
    expect(Object.keys(after!.skills).sort()).toEqual(['alpha', 'delta', 'gamma']);
  });

  it('rolls back new skill dirs and keeps the lock when a later install fails', async () => {
    const scope = await tempScope();
    const plan = await planAlphaOnlyAgainstV3(scope);
    const lockBefore = await readFile(scope.lockPath, 'utf8');

    const install = await import('../../src/lib/install.js');
    const realMaterialize = install.materializeFromLockEntry;
    // alpha refresh and delta install succeed; beta fails.
    vi.spyOn(install, 'materializeFromLockEntry')
      .mockImplementationOnce(realMaterialize)
      .mockImplementationOnce(realMaterialize)
      .mockRejectedValueOnce(new Error('beta fail'));

    await expect(
      applyChoices(plan, {
        orphansToRemove: new Set(),
        dependenciesToInstall: new Set(),
        newSkillsToInstall: new Set(['gamma']),
      }),
    ).rejects.toThrow('Update failed');

    expect(await readFile(scope.lockPath, 'utf8')).toBe(lockBefore);
    for (const name of ['delta', 'gamma']) {
      await expect(readFile(path.join(scope.skillsDir, name, 'SKILL.md'), 'utf8')).rejects.toThrow();
    }
  });
});

describe('applyDriftPlan adding a target', () => {
  it('materializes every locked skill into Claude Code and records both targets', async () => {
    const scope = await tempScope();
    const bundle = await resolveBundle({ source: bundleMini });
    const alphaHash = await computeSkillFolderHash(path.join(bundleMini, 'alpha'));
    await symlink(path.join(bundleMini, 'alpha'), path.join(scope.skillsDir, 'alpha'), 'dir');
    await writeFile(scope.lockPath, JSON.stringify({
      version: LOCK_VERSION,
      source: DEFAULT_GITHUB_SOURCE,
      sourceType: 'github',
      commit: bundle.commit,
      defaultLinkType: 'symlink',
      package: { name: 'bundle-mini', version: '0.0.0' },
      skills: {
        alpha: {
          source: DEFAULT_GITHUB_SOURCE,
          sourceType: 'github',
          computedHash: alphaHash,
          linkType: 'symlink',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    }));

    const lock = (await readLockfile(scope.lockPath))!;
    const plan = await planDriftFromBundles({ scope, lock, bundle, commitDrift: false });
    const result = await applyDriftPlan(plan, {
      orphansToRemove: new Set(),
      installs: [],
      addTargets: ['claude'],
    });

    expect(result.targetsAdded).toEqual(['claude']);
    await expect(
      readFile(path.join(scope.cwd, '.claude/skills/alpha/SKILL.md'), 'utf8'),
    ).resolves.toBeTruthy();
    const after = await readLockfile(scope.lockPath);
    expect(after?.targets).toEqual(['claude', 'cursor']);
  });
});
