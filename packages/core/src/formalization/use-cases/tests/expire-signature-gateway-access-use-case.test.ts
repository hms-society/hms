import { describe, expect, it, vi } from 'vitest'
import { ExpireSignatureGatewayAccessUseCase } from '../expire-signature-gateway-access-use-case'

describe('Expire Signature Gateway Access Use Case', () => {
  it('requires and delegates one bounded expiry operation', async () => {
    const occurredAt = new Date('2026-01-01T00:00:00.000Z')
    const expire = vi.fn().mockResolvedValue({
      invitations: 1,
      challenges: 2,
      sessions: 3,
      bindings: 4,
    })

    await expect(
      new ExpireSignatureGatewayAccessUseCase({ expire }).execute({
        occurredAt,
        limit: 10,
      }),
    ).resolves.toEqual({ invitations: 1, challenges: 2, sessions: 3, bindings: 4 })
    expect(expire).toHaveBeenCalledWith({ occurredAt, limit: 10 })
  })
})
