import { describe, expect, it } from 'vitest';
import {
  expandDependencies,
  findInstalledDependents,
  formatRemoveDependentNote,
} from '../../src/lib/deps.js';
import type { SkillsManifest } from '../../src/lib/bundle.js';

const manifest: SkillsManifest = {
  schema_version: 1,
  name: 'test',
  version: '0.0.0',
  skills: ['skills/alpha', 'skills/beta', 'skills/gamma'],
  dependsOn: {
    beta: ['alpha'],
    gamma: ['beta'],
  },
};

describe('expandDependencies', () => {
  it('installs transitive deps in dependency-first order', () => {
    const { ordered, addedBy } = expandDependencies(manifest, ['gamma']);
    expect(ordered).toEqual(['alpha', 'beta', 'gamma']);
    expect(addedBy.get('alpha')).toBe('beta');
    expect(addedBy.get('beta')).toBe('gamma');
  });

  it('detects cycles', () => {
    const cyclic: SkillsManifest = {
      ...manifest,
      dependsOn: { alpha: ['beta'], beta: ['alpha'] },
    };
    expect(() => expandDependencies(cyclic, ['alpha'])).toThrow(/Circular/);
  });
});

describe('findInstalledDependents', () => {
  it('lists installed skills that depend on a removal target', () => {
    const warnings = findInstalledDependents(
      manifest,
      ['alpha', 'beta', 'gamma'],
      ['alpha'],
    );
    expect(warnings).toEqual([
      { target: 'alpha', dependents: ['beta'] },
    ]);
  });

  it('skips dependents also selected for removal', () => {
    const warnings = findInstalledDependents(
      manifest,
      ['alpha', 'beta', 'gamma'],
      ['alpha', 'beta', 'gamma'],
    );
    expect(warnings).toEqual([]);
  });

  it('warns when a remaining installed skill depends on a co-selected target', () => {
    const warnings = findInstalledDependents(
      manifest,
      ['alpha', 'beta', 'gamma'],
      ['alpha', 'beta'],
    );
    expect(warnings).toEqual([{ target: 'beta', dependents: ['gamma'] }]);
  });

  it('formats a note for the interactive prompt', () => {
    const note = formatRemoveDependentNote([
      { target: 'alpha', dependents: ['beta', 'gamma'] },
    ]);
    expect(note).toContain('beta, gamma depend on alpha');
  });
});
