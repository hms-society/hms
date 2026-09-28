import { fileURLToPath, URL } from 'node:url'

import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/', import.meta.url)),
    },
  },
  test: {
    coverage: {
      exclude: [
        'src/**/*.{test,spec}.ts',
        'src/**/tests/**',
        'src/**/fixtures/**',
        'src/**/index.ts',
        'src/**/*.d.ts',
      ],
      include: ['src/**/*.ts'],
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
        branches: 40.8,
        functions: 54.5,
        lines: 51.6,
        statements: 50.8,
      },
    },
    fileParallelism: false,
    globals: true,
    hookTimeout: 120_000,
    root: './',
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  oxc: false,
})
