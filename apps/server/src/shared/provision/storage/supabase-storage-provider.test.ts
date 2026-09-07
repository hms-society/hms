import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { AppError } from '@hms/core/shared/domain/errors'
import type { EnvProvider } from '../env/env-provider'
import { SupabaseStorageProvider } from './supabase-storage-provider'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

describe('SupabaseStorageProvider', () => {
  const createBucket = vi.fn()
  const upload = vi.fn()
  const from = vi.fn()
  const supabaseClient = {
    storage: {
      createBucket,
      from,
    },
  } as unknown as SupabaseClient

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockReturnValue(supabaseClient as any)
    createBucket.mockResolvedValue({ data: null, error: null })
    upload.mockResolvedValue({ data: { path: 'seed/file.pdf' }, error: null })
    from.mockReturnValue({ upload })
  })

  it('uploads documents to the configured private bucket', async () => {
    const provider = new SupabaseStorageProvider(createEnvProvider())

    await expect(
      provider.upload('seed/file.pdf', new Uint8Array([1]), 'application/pdf'),
    ).resolves.toBe('seed/file.pdf')

    expect(createBucket).toHaveBeenCalledWith('documents', { public: false })
    expect(from).toHaveBeenCalledWith('documents')
    expect(upload).toHaveBeenCalledWith('seed/file.pdf', new Uint8Array([1]), {
      contentType: 'application/pdf',
      upsert: true,
    })
  })

  it('maps Supabase upload failures to an application error', async () => {
    upload.mockResolvedValue({
      data: null,
      error: { message: 'Bucket not found' },
    })
    const provider = new SupabaseStorageProvider(createEnvProvider())

    await expect(
      provider.upload('seed/file.pdf', new Uint8Array([1]), 'application/pdf'),
    ).rejects.toThrow(AppError)
  })
})

function createEnvProvider(): EnvProvider {
  return {
    get(key) {
      const env = {
        SUPABASE_URL: 'http://localhost:8000',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
        SUPABASE_STORAGE_BUCKET: 'documents',
      }

      return env[key as keyof typeof env]
    },
  } as EnvProvider
}
