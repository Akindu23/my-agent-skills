import { describe, expect, it } from 'vitest';
import { renderBanner } from '../../src/lib/banner.js';
import { stripAnsi } from '../../src/lib/theme.js';

describe('renderBanner', () => {
  it('includes block logo, subtitle, and repo link without command cheatsheet', () => {
    const plain = stripAnsi(renderBanner());

    expect(plain).toContain('██╔════╝██║   ██║');
    expect(plain).toContain('███████╗██╗  ██╗');
    expect(plain).toContain('Agent Skills for Cursor by Akindu Karunaratne');
    expect(plain).toContain('github.com/Akindu23/my-agent-skills');
    expect(plain).not.toContain('npx my-agent-skills');
    expect(plain).not.toContain('try:');
  });
});
