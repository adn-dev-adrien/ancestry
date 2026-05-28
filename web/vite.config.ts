import { execSync } from 'node:child_process';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// Commit SHA baked into the build: from VITE_COMMIT_SHA (CI/Docker) or local git, else ''.
function commitSha(): string {
  if (process.env.VITE_COMMIT_SHA) return process.env.VITE_COMMIT_SHA;
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch {
    return '';
  }
}

export default defineConfig({
  define: {
    __COMMIT_SHA__: JSON.stringify(commitSha()),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
