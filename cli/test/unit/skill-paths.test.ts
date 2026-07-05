import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertContained,
  assertValidSkillName,
  resolveSkillDestDir,
  resolveSkillSourceDir,
} from '../../src/lib/skill-paths.js';
import { CliError } from '../../src/lib/errors.js';

describe('assertValidSkillName', () => {
  it('accepts kebab-case names', () => {
    expect(() => assertValidSkillName('pitstop')).not.toThrow();
    expect(() => assertValidSkillName('my-skill')).not.toThrow();
  });

  it('rejects traversal and separators', () => {
    expect(() => assertValidSkillName('../evil')).toThrow(CliError);
    expect(() => assertValidSkillName('foo/bar')).toThrow(CliError);
    expect(() => assertValidSkillName('')).toThrow(CliError);
    expect(() => assertValidSkillName('..')).toThrow(CliError);
  });
});

describe('assertContained', () => {
  it('rejects paths that escape the base directory', () => {
    const base = path.resolve('/tmp/skills');
    expect(() => assertContained(base, path.resolve('/tmp/skills-evil'))).toThrow(CliError);
    expect(() => assertContained(base, path.resolve('/tmp/skills/../outside'))).toThrow(CliError);
  });

  it('allows the base directory itself', () => {
    const base = path.resolve('/tmp/skills');
    expect(() => assertContained(base, base)).not.toThrow();
  });
});

describe('resolveSkillDestDir', () => {
  it('joins under skillsDir and validates name', () => {
    const skillsDir = path.resolve('/proj/.agents/skills');
    expect(resolveSkillDestDir(skillsDir, 'alpha')).toBe(path.join(skillsDir, 'alpha'));
  });

  it('rejects malicious names before join', () => {
    const skillsDir = path.resolve('/proj/.agents/skills');
    expect(() => resolveSkillDestDir(skillsDir, '../evil')).toThrow(CliError);
  });
});

describe('resolveSkillSourceDir', () => {
  it('joins under bundle root', () => {
    const root = path.resolve('/bundle/skills');
    expect(resolveSkillSourceDir(root, 'beta')).toBe(path.join(root, 'beta'));
  });
});
