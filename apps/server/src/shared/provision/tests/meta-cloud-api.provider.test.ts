import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { MetaCloudApiProvider } from '../meta-cloud-api.provider'
import type { EnvProvider } from '../env/env-provider'
import { AppError } from '@hms/core/shared/domain/errors'

describe('MetaCloudApiProvider', () => {
  let provider: MetaCloudApiProvider
  let mockEnvProvider: EnvProvider
  const originalFetch = global.fetch

  beforeEach(() => {
    mockEnvProvider = {
      get: vi.fn((key: string) => {
        if (key === 'META_APP_ID') return 'test_app_id'
        if (key === 'META_APP_SECRET') return 'test_app_secret'
        return undefined
      }),
    } as unknown as EnvProvider
    provider = new MetaCloudApiProvider(mockEnvProvider)
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  describe('exchangeCodeForToken', () => {
    it('successfully exchanges code for token', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'meta_access_token_123',
          token_type: 'bearer',
        }),
      } as Response)

      const result = await provider.exchangeCodeForToken('valid_auth_code')
      expect(result).toEqual({
        accessToken: 'meta_access_token_123',
        tokenType: 'bearer',
      })
    })

    it('throws AppError if response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid OAuth code',
      } as Response)

      await expect(provider.exchangeCodeForToken('invalid_code')).rejects.toThrow(
        AppError,
      )
    })

    it('throws AppError if response does not contain access_token', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response)

      await expect(provider.exchangeCodeForToken('no_token_code')).rejects.toThrow(
        AppError,
      )
    })

    it('returns fallback mock token in test mode when network throws', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

      const result = await provider.exchangeCodeForToken('mock_code_123')
      expect(result).toEqual({
        accessToken: 'mock_system_user_access_token',
        tokenType: 'bearer',
      })
    })
  })

  describe('getPhoneNumberDetails', () => {
    it('successfully retrieves phone number details', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          display_phone_number: '+55 11 98765-4321',
          verified_name: 'HMS Law Firm',
          quality_rating: 'GREEN',
        }),
      } as Response)

      const result = await provider.getPhoneNumberDetails('123456789', 'token_123')
      expect(result).toEqual({
        displayPhoneNumber: '+55 11 98765-4321',
        verifiedName: 'HMS Law Firm',
        qualityRating: 'GREEN',
      })
    })

    it('falls back to mock details on error when test or mock id', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      } as Response)

      const result = await provider.getPhoneNumberDetails('phone_12345', 'token_123')
      expect(result).toEqual({
        displayPhoneNumber: '+5511999998888',
        verifiedName: 'Advocacia HMS',
        qualityRating: 'GREEN',
      })
    })

    it('handles exception and returns fallback when phone_ prefix', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

      const result = await provider.getPhoneNumberDetails('phone_12345', 'token_123')
      expect(result).toEqual({
        displayPhoneNumber: '+5511999998888',
        verifiedName: 'Advocacia HMS',
        qualityRating: 'GREEN',
      })
    })
  })
})
