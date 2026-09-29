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
    },
    globals: true,
  },
})
