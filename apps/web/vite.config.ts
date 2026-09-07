import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { nitro } from 'nitro/vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const webAppPort = Number(env.HMS_WEB_APP_PORT)
  const serverAppUrl = env.VITE_HMS_SERVER_APP_URL

  if (
    command !== 'build' &&
    (!Number.isInteger(webAppPort) || webAppPort < 1 || webAppPort > 65535)
  ) {
    throw new Error('HMS_WEB_APP_PORT must be an integer between 1 and 65535.')
  }

  if (command !== 'build' && !serverAppUrl) {
    throw new Error('VITE_HMS_SERVER_APP_URL is required outside production builds.')
  }

  return {
    resolve: { tsconfigPaths: true },
    plugins: [
      devtools(),
      tailwindcss(),
      tanstackStart(),
      ...(mode === 'test'
        ? []
        : [
            nitro({
              ...(serverAppUrl
                ? {
                    devProxy: {
                      '/assinaturas/provedor/**': {
                        target: serverAppUrl,
                        changeOrigin: true,
                      },
                    },
                  }
                : {}),
            }),
          ]),
      viteReact(),
    ],
    ...(command === 'build'
      ? {}
      : {
          server: {
            port: webAppPort,
            proxy: {
              '/assinaturas/provedor': {
                target: serverAppUrl,
                changeOrigin: true,
              },
            },
          },
          preview: { port: webAppPort },
        }),
  }
})

export default config
