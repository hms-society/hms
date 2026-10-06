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

    expect(env.SUPABASE_STORAGE_BUCKET).toBe('hms-bucket')
  })

  it('defaults the AI provider to OpenRouter', () => {
    const env = envSchema.parse({
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/hms',
      HMS_SERVER_APP_MODE: 'dev',
      HMS_WEB_APP_URL: 'http://localhost:3000',
      SUPABASE_URL: 'http://localhost:8000',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    })

    expect(env.AI_PROVIDER).toBe('openrouter')
  })

  it('treats blank cloud-provider settings as unset', () => {
    const env = envSchema.parse({
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/hms',
      HMS_SERVER_APP_MODE: 'dev',
      HMS_WEB_APP_URL: 'http://localhost:3000',
      SUPABASE_URL: 'http://localhost:8000',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      GEMINI_API_KEY: '',
      GEMINI_AI_MODEL: '',
      GEMINI_VISION_AI_MODEL: '',
      OPENROUTER_API_KEY: '',
    })

    expect(env.GEMINI_API_KEY).toBeUndefined()
    expect(env.GEMINI_AI_MODEL).toBeUndefined()
    expect(env.GEMINI_VISION_AI_MODEL).toBeUndefined()
    expect(env.OPENROUTER_API_KEY).toBeUndefined()
  })

  it.each([
    'gemini',
    'openrouter',
  ])('accepts %s as a development AI provider', (provider) => {
    const env = envSchema.parse({
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/hms',
      HMS_SERVER_APP_MODE: 'dev',
      HMS_WEB_APP_URL: 'http://localhost:3000',
      SUPABASE_URL: 'http://localhost:8000',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      AI_PROVIDER: provider,
    })

    expect(env.AI_PROVIDER).toBe(provider)
  })
})
