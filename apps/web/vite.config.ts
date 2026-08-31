import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { nitro } from 'nitro/vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const webAppPort = Number(env.HMS_WEB_APP_PORT)

  if (!Number.isInteger(webAppPort) || webAppPort < 1 || webAppPort > 65535) {
    throw new Error('HMS_WEB_APP_PORT must be an integer between 1 and 65535.')
  }

  return {
    resolve: { tsconfigPaths: true },
    plugins: [
      devtools(),
      tailwindcss(),
      tanstackStart(),
      ...(mode === 'test' ? [] : [nitro()]),
      viteReact(),
    ],
    server: { port: webAppPort },
    preview: { port: webAppPort },
  }
})

export default config
