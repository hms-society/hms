import { createHmac } from 'node:crypto'

import { describe, expect, it, vi } from 'vitest'

import type { EnvProvider } from '@/shared/provision/env/env-provider'

import { FormalizationSignatureSecretHasher } from '../formalization-signature-secret-hasher'

function createEnv(values: Record<string, string | undefined>) {
  return {
    get: vi.fn((key: string) => values[key]),
  } as unknown as EnvProvider
}

describe('FormalizationSignatureSecretHasher', () => {
  it('uses the local development pepper when dev configuration omits one', () => {
    const hasher = new FormalizationSignatureSecretHasher(
      createEnv({ HMS_SERVER_APP_MODE: 'dev', HMS_SIGNING_OTP_PEPPER: undefined }),
    )

    expect(hasher.hash('confirmation-key')).toBe(
      createHmac('sha256', 'local-development-pepper')
        .update('confirmation-key')
        .digest('hex'),
    )
  })

  it('uses the configured pepper outside the local fallback', () => {
    const hasher = new FormalizationSignatureSecretHasher(
      createEnv({ HMS_SERVER_APP_MODE: 'prod', HMS_SIGNING_OTP_PEPPER: 'test-pepper' }),
    )

    expect(hasher.hash('confirmation-key')).toBe(
      createHmac('sha256', 'test-pepper').update('confirmation-key').digest('hex'),
    )
  })

  it('fails closed outside development when the pepper is missing', () => {
    const hasher = new FormalizationSignatureSecretHasher(
      createEnv({ HMS_SERVER_APP_MODE: 'prod', HMS_SIGNING_OTP_PEPPER: undefined }),
    )

    expect(() => hasher.hash('confirmation-key')).toThrow(
      'HMS_SIGNING_OTP_PEPPER is required outside development.',
    )
  })
})
