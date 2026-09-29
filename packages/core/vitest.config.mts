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
      // Thresholds set to 0 to avoid blocking CI on legacy code while reporting coverage
      thresholds: {
        autoUpdate: false,
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
      },
    },
    globals: true,
  },
})
