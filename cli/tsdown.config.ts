import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/cli.ts'],
  platform: 'node',
  format: 'esm',
  banner: { js: '#!/usr/bin/env node' },
  clean: true,
});
