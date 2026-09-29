import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { nitro } from 'nitro/vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    resolve: { tsconfigPaths: true },
    server: { port: Number(env.HMS_WEB_APP_PORT) || 3000 },
    plugins: [
      devtools(),
      tailwindcss(),
      tanstackStart(),
      ...(mode === 'test' ? [] : [nitro()]),
      viteReact(),
    ],
  }
})

export default config
