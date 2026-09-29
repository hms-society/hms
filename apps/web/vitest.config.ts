import { fileURLToPath, URL } from 'node:url'

import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    coverage: {
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/tests/**',
        'src/routeTree.gen.ts',
      ],
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: [
        'text-summary',
        'json-summary',
        'html',
        ['lcov', { projectRoot: '../..' }],
      ],
      reportOnFailure: true,
      reportsDirectory: './coverage',
      // Rebased on current develop coverage after the Portal surfaces were restored; raise as coverage improves.
      thresholds: {
        autoUpdate: false,
        branches: 45.3,
        functions: 43.7,
        lines: 48.3,
        statements: 46.8,
      },
    },
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['src/routes/**/tests/**/*.test.tsx'],
  },
})
