import z from 'zod'

const browserEnv = {
  hmsServerAppUrl: import.meta.env.VITE_HMS_SERVER_APP_URL,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_KEY,
  supabaseStorageBucket: import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'documents',
}

export const browserEnvSchema = z.object({
  hmsServerAppUrl: z.url(),
  supabaseUrl: z.url(),
  supabaseKey: z.string(),
  supabaseStorageBucket: z.string().min(1),
})

export const BROWSER_ENV = browserEnvSchema.parse(browserEnv)
