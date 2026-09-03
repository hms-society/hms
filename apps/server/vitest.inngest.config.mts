import { fileURLToPath, URL } from 'node:url'

import swc from 'unplugin-swc'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/', import.meta.url)),
    },
  },
  test: {
    exclude: configDefaults.exclude,
    fileParallelism: false,
    globals: true,
    hookTimeout: 240_000,
    include: ['src/**/messaging/inngest/jobs/tests/**/*.test.ts'],
    root: './',
    testTimeout: 240_000,
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  oxc: false,
})
