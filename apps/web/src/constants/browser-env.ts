import z from 'zod'

const browserEnv = {
  hmsServerAppUrl: import.meta.env.VITE_HMS_SERVER_APP_URL,
}

export const browserEnvSchema = z.object({
  hmsServerAppUrl: z.url(),
})

export const BROWSER_ENV = browserEnvSchema.parse(browserEnv)
