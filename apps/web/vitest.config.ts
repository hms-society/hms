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
      // Measured floor on 2026-09-24. Raise as coverage improves.
      thresholds: {
        autoUpdate: false,
        branches: 45.6,
        functions: 44,
        lines: 48.7,
        statements: 47.2,
      },
    },
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['src/routes/**/tests/**/*.test.tsx'],
  },
})
