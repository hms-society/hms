import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        'src/**/*.{test,spec}.ts',
        'src/**/tests/**',
        'src/**/fakers/**',
        'src/**/index.ts',
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
        branches: 61.5,
        functions: 68.9,
        lines: 73.5,
        statements: 70.3,
      },
    },
    globals: true,
  },
})
