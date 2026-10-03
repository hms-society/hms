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
    globalSetup: ['./src/shared/rest/tests/test-services-global-setup.ts'],
    setupFiles: ['./src/shared/rest/tests/test-services-setup.ts'],
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
      // Thresholds set to 0 to avoid blocking CI on legacy code while reporting coverage
      thresholds: {
        autoUpdate: false,
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
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
