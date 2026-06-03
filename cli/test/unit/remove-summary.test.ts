import { describe, expect, it } from 'vitest';
import { renderRemoveSummary } from '../../src/lib/remove-summary.js';
import { stripAnsi } from '../../src/lib/theme.js';

describe('renderRemoveSummary', () => {
  it('renders header and removed skill rows', () => {
    const body = stripAnsi(
      renderRemoveSummary({
        scope: {
          scope: 'project',
          agentsDir: '/proj/.agents',
          skillsDir: '/proj/.agents/skills',
          lockPath: '/proj/.agents/cursor-skills-lock.json',
          cwd: '/proj',
        },
        removed: ['caveman'],
      }),
    );

    expect(body).toContain('Scope: project');
    expect(body).toContain('Destination: /proj/.agents/skills');
    expect(body).toContain('Removed: 1');
    expect(body).toContain('removed  caveman');
  });
});
