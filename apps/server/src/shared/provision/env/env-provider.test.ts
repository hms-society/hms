import { describe, expect, it } from 'vitest'

import { envSchema } from './env-provider'

describe('envSchema', () => {
  it.each([
    undefined,
    '',
  ])('defaults the Supabase storage bucket when the value is %s', (storageBucket) => {
    const env = envSchema.parse({
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/hms',
      HMS_SERVER_APP_MODE: 'dev',
      HMS_WEB_APP_URL: 'http://localhost:3000',
      SUPABASE_URL: 'http://localhost:8000',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      SUPABASE_STORAGE_BUCKET: storageBucket,
    })

    expect(env.SUPABASE_STORAGE_BUCKET).toBe('documents')
  })
})
