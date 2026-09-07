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
    exclude: [...configDefaults.exclude, 'src/**/messaging/inngest/jobs/tests/**'],
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
