import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveBundle } from '../../src/lib/bundle.js';
import { buildDriftReport, createDriftPlan } from '../../src/lib/drift-plan.js';
import { computeSkillFolderHash } from '../../src/lib/hash.js';
import type { ScopePaths } from '../../src/lib/scope.js';

const cliRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const bundleMini = path.join(cliRoot, 'test/fixtures/bundle-mini/skills');
const tmpDirs: string[] = [];

async function tempScope(): Promise<ScopePaths> {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'cas-drift-'));
  tmpDirs.push(cwd);
  const agentsDir = path.join(cwd, '.agents');
  return {
    scope: 'project',
    cwd,
    agentsDir,
    skillsDir: path.join(agentsDir, 'skills'),
    lockPath: path.join(agentsDir, 'cursor-skills.lock'),
  };
}

async function writeLock(
  scope: ScopePaths,
  skills: Record<string, { computedHash: string; linkType?: 'symlink' | 'copy' }>,
  pkgVersion = '0.1.0',
): Promise<void> {
  await mkdir(path.dirname(scope.lockPath), { recursive: true });
  const body: Record<string, unknown> = {
    version: 1,
    package: { name: 'bundle-mini', version: pkgVersion },
    skills: {},
  };
  for (const [name, meta] of Object.entries(skills)) {
    (body.skills as Record<string, unknown>)[name] = {
      source: 'bundle-mini',
      sourceType: 'bundled',
      computedHash: meta.computedHash,
      linkType: meta.linkType ?? 'symlink',
      installedAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
  }
  await writeFile(scope.lockPath, JSON.stringify(body));
}

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

describe('createDriftPlan', () => {
  it('reports ok when lock hash matches bundle', async () => {
    const scope = await tempScope();
    const alphaSource = path.join(bundleMini, 'alpha');
    const hash = await computeSkillFolderHash(alphaSource);
    await writeLock(scope, { alpha: { computedHash: hash } });

    const bundle = await resolveBundle({ source: bundleMini });
    const plan = await createDriftPlan({ scope, bundle });

    expect(plan.packageDrift).toBe(false);
    expect(plan.entries).toEqual([
      expect.objectContaining({ name: 'alpha', status: 'ok' }),
    ]);
  });

  it('reports hashDrift when lock hash is stale', async () => {
    const scope = await tempScope();
    await writeLock(scope, { alpha: { computedHash: 'stale-hash' } });

    const bundle = await resolveBundle({ source: bundleMini });
    const plan = await createDriftPlan({ scope, bundle });

    expect(plan.entries).toEqual([
      expect.objectContaining({ name: 'alpha', status: 'hashDrift' }),
    ]);
  });

  it('reports packageDrift when only lock package version differs', async () => {
    const scope = await tempScope();
    const alphaSource = path.join(bundleMini, 'alpha');
    const hash = await computeSkillFolderHash(alphaSource);
    await writeLock(scope, { alpha: { computedHash: hash } }, '9.9.9');

    const bundle = await resolveBundle({ source: bundleMini });
    const plan = await createDriftPlan({ scope, bundle });

    expect(plan.packageDrift).toBe(true);
    expect(plan.entries.every((e) => e.status === 'ok')).toBe(true);
  });

  it('reports orphan when lock skill is absent from bundle', async () => {
    const scope = await tempScope();
    await writeLock(scope, { ghost: { computedHash: 'abc' } });

    const bundle = await resolveBundle({ source: bundleMini });
    const plan = await createDriftPlan({ scope, bundle });

    expect(plan.entries).toEqual([
      expect.objectContaining({ name: 'ghost', status: 'orphan' }),
    ]);
  });
});

describe('buildDriftReport', () => {
  it('sets hasDrift false when fully in sync', async () => {
    const scope = await tempScope();
    const hash = await computeSkillFolderHash(path.join(bundleMini, 'alpha'));
    await writeLock(scope, { alpha: { computedHash: hash } });

    const plan = await createDriftPlan({ scope, source: bundleMini });
    const report = buildDriftReport(plan);

    expect(report.hasDrift).toBe(false);
    expect(report.jsonPayload.inSync).toBe(true);
  });

  it('sets hasDrift true on hash drift, orphan, or package drift', async () => {
    const scope = await tempScope();
    await writeLock(scope, { alpha: { computedHash: 'stale' } });

    const plan = await createDriftPlan({ scope, source: bundleMini });
    const report = buildDriftReport(plan);

    expect(report.hasDrift).toBe(true);
    expect(report.jsonPayload.inSync).toBe(false);
    expect(report.jsonPayload.skills[0]?.status).toBe('hashDrift');
  });
});
