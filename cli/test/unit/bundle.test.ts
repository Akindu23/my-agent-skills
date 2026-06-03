import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { detectMonorepoSkillsRoot, packageRoot, resolveBundle } from '../../src/lib/bundle.js';

const cliRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = path.resolve(cliRoot, '..');

describe('detectMonorepoSkillsRoot', () => {
  it('finds repo-root skills/ when CLI package is in cli/', async () => {
    const found = await detectMonorepoSkillsRoot(cliRoot);
    expect(found).toBe(path.join(repoRoot, 'skills'));
  });

  it('returns null when parent has no skills.json', async () => {
    const found = await detectMonorepoSkillsRoot(path.join(repoRoot, 'cli', 'test', 'fixtures'));
    expect(found).toBeNull();
  });
});

describe('resolveBundle', () => {
  it('prefers monorepo skills/ without CURSOR_AGENT_SKILLS_ROOT', async () => {
    const prev = process.env.CURSOR_AGENT_SKILLS_ROOT;
    delete process.env.CURSOR_AGENT_SKILLS_ROOT;
    try {
      const bundle = await resolveBundle({});
      expect(bundle.root).toBe(path.join(repoRoot, 'skills'));
    } finally {
      if (prev !== undefined) {
        process.env.CURSOR_AGENT_SKILLS_ROOT = prev;
      } else {
        delete process.env.CURSOR_AGENT_SKILLS_ROOT;
      }
    }
  });

  it('honors CURSOR_AGENT_SKILLS_ROOT over monorepo detect', async () => {
    const mini = path.join(cliRoot, 'test/fixtures/bundle-mini/skills');
    const prev = process.env.CURSOR_AGENT_SKILLS_ROOT;
    process.env.CURSOR_AGENT_SKILLS_ROOT = mini;
    try {
      const bundle = await resolveBundle({});
      expect(bundle.root).toBe(path.resolve(mini));
    } finally {
      if (prev !== undefined) {
        process.env.CURSOR_AGENT_SKILLS_ROOT = prev;
      } else {
        delete process.env.CURSOR_AGENT_SKILLS_ROOT;
      }
    }
  });
});

describe('packageRoot', () => {
  it('points at the cli package directory from source layout', () => {
    expect(packageRoot()).toBe(cliRoot);
  });
});
