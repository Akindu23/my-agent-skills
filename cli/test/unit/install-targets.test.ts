import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  expandCliTarget,
  mergeLockTargets,
  normalizeTargetsForWrite,
  resolveEffectiveTargets,
  resolveTargetSkillsDir,
} from '../../src/lib/install-targets.js';
import type { ScopePaths } from '../../src/lib/scope.js';

describe('install-targets', () => {
  it('expands both and sorts unique atoms', () => {
    expect(expandCliTarget('both')).toEqual(['claude', 'cursor']);
    expect(expandCliTarget('claude')).toEqual(['claude']);
    expect(normalizeTargetsForWrite(['cursor'])).toBeUndefined();
    expect(normalizeTargetsForWrite(['claude', 'cursor'])).toEqual(['claude', 'cursor']);
    expect(mergeLockTargets(['cursor'], ['claude'])).toEqual(['claude', 'cursor']);
  });

  it('resolves project and global Claude paths', () => {
    const project: ScopePaths = {
      scope: 'project',
      cwd: '/repo',
      agentsDir: '/repo/.agents',
      skillsDir: '/repo/.agents/skills',
      lockPath: '/repo/.agents/cursor-skills-lock.json',
    };
    expect(resolveTargetSkillsDir(project, 'cursor')).toBe('/repo/.agents/skills');
    expect(resolveTargetSkillsDir(project, 'claude')).toBe('/repo/.claude/skills');

    const globalScope: ScopePaths = {
      scope: 'global',
      cwd: '/repo',
      agentsDir: path.join(os.homedir(), '.agents'),
      skillsDir: path.join(os.homedir(), '.agents', 'skills'),
      lockPath: path.join(os.homedir(), '.agents', 'cursor-skills-lock.json'),
    };
    expect(resolveTargetSkillsDir(globalScope, 'claude')).toBe(
      path.join(os.homedir(), '.claude', 'skills'),
    );
    expect(resolveEffectiveTargets(null)).toEqual(['cursor']);
  });
});
