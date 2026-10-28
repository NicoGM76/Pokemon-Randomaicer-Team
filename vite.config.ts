import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Pokemon-Randomaicer-Team/',
  plugins: [react()],
  test: {
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.node.test.ts',
      'scripts/**/*.test.mjs'
    ]
  }
});
