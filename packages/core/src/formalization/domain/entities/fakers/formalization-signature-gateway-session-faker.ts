import { faker } from '@faker-js/faker'
import type { FormalizationSignatureGatewaySession } from '../formalization-signature-gateway-session'

export function fakeFormalizationSignatureGatewaySession(
  overrides: Partial<FormalizationSignatureGatewaySession> = {},
): FormalizationSignatureGatewaySession {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: faker.string.uuid(),
    requestId: faker.string.uuid(),
    recipientId: faker.string.uuid(),
    snapshotId: faker.string.uuid(),
    kind: 'flow',
    tokenHash: faker.string.hexadecimal({ length: 64, prefix: '' }),
    deviceSecretHash: faker.string.hexadecimal({ length: 64, prefix: '' }),
    csrfHash: faker.string.hexadecimal({ length: 64, prefix: '' }),
    status: 'active',
    issuedAt: now,
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    version: 1,
    ...overrides,
  }
}
