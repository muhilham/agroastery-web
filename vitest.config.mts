import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.worktrees/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      // 'server-only' throws when imported outside the react-server condition
      // (Next internals pulled in by lib/testing/seo.ts require it).
      'server-only': path.resolve(__dirname, './lib/testing/server-only-stub.js'),
    },
  },
});
