import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '@hms/core/shared/domain/errors'

import { EnvProvider } from '@/shared/provision/env/env-provider'
import { MetaCloudApiProvider } from '@/shared/provision/meta-cloud-api.provider'

describe('MetaCloudApiProvider', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('rejects missing app credentials before making an OAuth request', async () => {
    const envProvider = {
      get(key: string) {
        if (key === 'META_APP_ID') return 'local-meta-app-id'
        if (key === 'META_APP_SECRET') return ''
        return 'http://127.0.0.1:1234/v25.0'
      },
    } as unknown as EnvProvider
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const provider = new MetaCloudApiProvider(envProvider)

    await expect(
      provider.exchangeCodeForToken('authorization-code'),
    ).rejects.toBeInstanceOf(AppError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
