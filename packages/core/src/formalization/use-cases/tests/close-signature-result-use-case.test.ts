import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { fakeFormalizationSignatureGatewaySession } from '../../domain/entities/fakers'
import type { FormalizationSignatureGatewaySessionsRepository } from '../../interfaces'
import { CloseSignatureResultUseCase } from '../close-signature-result-use-case'

function makeFixture() {
  const sessionsRepository = mock<FormalizationSignatureGatewaySessionsRepository>()
  sessionsRepository.findByTokenHash.mockResolvedValue(
    fakeFormalizationSignatureGatewaySession({
      id: 'session-1',
      kind: 'result',
      status: 'active',
      tokenHash: 'session-hash',
      deviceSecretHash: 'device-hash',
      csrfHash: 'csrf-hash',
      version: 3,
    }),
  )
  sessionsRepository.replace.mockResolvedValue(true)
  const useCase = new CloseSignatureResultUseCase({
    sessionsRepository,
    hash: (value) => `${value}-hash`,
  })
  return { sessionsRepository, useCase }
}

describe('Close Signature Result Use Case', () => {
  it('revokes only the exact result session selected by sessionToken', async () => {
    const fixture = makeFixture()

    await fixture.useCase.execute({
      sessionToken: 'session',
      deviceToken: 'device',
      csrfToken: 'csrf',
    })

    expect(fixture.sessionsRepository.findByTokenHash).toHaveBeenCalledWith(
      'session-hash',
    )
    expect(fixture.sessionsRepository.replace).toHaveBeenCalledWith({
      sessionId: 'session-1',
      expectedVersion: 3,
      changes: expect.objectContaining({
        status: 'revoked',
        revocationReason: 'closed',
      }),
    })
  })

  it.each([
    ['missing', null],
    [
      'authenticated',
      fakeFormalizationSignatureGatewaySession({
        kind: 'authenticated',
        status: 'active',
      }),
    ],
    [
      'revoked',
      fakeFormalizationSignatureGatewaySession({ kind: 'result', status: 'revoked' }),
    ],
  ] as const)('rejects a %s result receipt without mutation', async (_label, session) => {
    const fixture = makeFixture()
    fixture.sessionsRepository.findByTokenHash.mockResolvedValue(session)

    await expect(
      fixture.useCase.execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
      }),
    ).rejects.toThrow()
    expect(fixture.sessionsRepository.replace).not.toHaveBeenCalled()
  })

  it.each([
    ['device', { deviceToken: 'wrong', csrfToken: 'csrf' }],
    ['csrf', { deviceToken: 'device', csrfToken: 'wrong' }],
  ])('rejects a wrong %s proof', async (_label, proof) => {
    const fixture = makeFixture()

    await expect(
      fixture.useCase.execute({ sessionToken: 'session', ...proof }),
    ).rejects.toThrow()
    expect(fixture.sessionsRepository.replace).not.toHaveBeenCalled()
  })

  it('fails closed on an optimistic close conflict', async () => {
    const fixture = makeFixture()
    fixture.sessionsRepository.replace.mockResolvedValue(false)

    await expect(
      fixture.useCase.execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
      }),
    ).rejects.toThrow()
  })
})
