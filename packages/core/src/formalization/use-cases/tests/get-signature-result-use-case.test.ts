import { describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { DatetimeProvider } from '../../../shared/interfaces'
import {
  fakeFormalizationSignatureGatewaySession,
  fakeFormalizationSignatureProtocol,
  fakeFormalizationSignatureRecipient,
  fakeFormalizationSignatureRequest,
} from '../../domain/entities/fakers'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureProtocolsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestsRepository,
} from '../../interfaces'
import { GetSignatureResultUseCase } from '../get-signature-result-use-case'

const NOW = new Date('2026-09-02T20:00:00.000Z')

type Dependencies = {
  sessionsRepository: MockProxy<FormalizationSignatureGatewaySessionsRepository>
  requestsRepository: MockProxy<FormalizationSignatureRequestsRepository>
  recipientsRepository: MockProxy<FormalizationSignatureRecipientsRepository>
  protocolsRepository: MockProxy<FormalizationSignatureProtocolsRepository>
  datetimeProvider: MockProxy<DatetimeProvider>
  hash: (value: string) => string
}

function makeDependencies(): Dependencies {
  const dependencies: Dependencies = {
    sessionsRepository: mock<FormalizationSignatureGatewaySessionsRepository>(),
    requestsRepository: mock<FormalizationSignatureRequestsRepository>(),
    recipientsRepository: mock<FormalizationSignatureRecipientsRepository>(),
    protocolsRepository: mock<FormalizationSignatureProtocolsRepository>(),
    datetimeProvider: mock<DatetimeProvider>(),
    hash: (value) => `${value}-hash`,
  }
  dependencies.datetimeProvider.now.mockReturnValue(NOW)
  dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
    fakeFormalizationSignatureGatewaySession({
      id: 'result-session',
      requestId: 'request-1',
      recipientId: 'recipient-1',
      snapshotId: 'snapshot-1',
      kind: 'result',
      status: 'active',
      deviceSecretHash: 'device-hash',
      expiresAt: new Date(NOW.getTime() + 60_000),
    }),
  )
  dependencies.requestsRepository.findById.mockResolvedValue(
    fakeFormalizationSignatureRequest({
      id: 'request-1',
      snapshotId: 'snapshot-1',
      status: 'submitted',
      submittedAt: NOW,
    }),
  )
  dependencies.recipientsRepository.findById.mockResolvedValue(
    fakeFormalizationSignatureRecipient({
      id: 'recipient-1',
      requestId: 'request-1',
      status: 'submitted',
      submittedAt: NOW,
    }),
  )
  dependencies.protocolsRepository.findByRecipientAndRequest.mockResolvedValue(
    fakeFormalizationSignatureProtocol({
      requestId: 'request-1',
      recipientId: 'recipient-1',
      number: 'PRO-123',
    }),
  )
  return dependencies
}

function execute(dependencies: Dependencies) {
  return new GetSignatureResultUseCase(dependencies).execute({
    sessionToken: 'result',
    deviceToken: 'device',
  })
}

describe('Get Signature Result Use Case', () => {
  it.each([
    {
      requestStatus: 'sent' as const,
      recipientStatus: 'submitted' as const,
      expected: 'submitted' as const,
    },
    {
      requestStatus: 'partially_submitted' as const,
      recipientStatus: 'submitted' as const,
      expected: 'submitted' as const,
    },
    {
      requestStatus: 'reconciliation_required' as const,
      recipientStatus: 'submitted' as const,
      expected: 'reconciliation_pending' as const,
    },
    {
      requestStatus: 'confirmed' as const,
      recipientStatus: 'confirmed' as const,
      expected: 'confirmed' as const,
    },
    {
      requestStatus: 'rejected' as const,
      recipientStatus: 'submitted' as const,
      expected: 'rejected' as const,
    },
    {
      requestStatus: 'sent' as const,
      recipientStatus: 'cancelled' as const,
      expected: 'cancelled' as const,
    },
    {
      requestStatus: 'expired' as const,
      recipientStatus: 'submitted' as const,
      expected: 'expired' as const,
    },
  ])('derives the authoritative $expected result from request and recipient', async ({
    requestStatus,
    recipientStatus,
    expected,
  }) => {
    const dependencies = makeDependencies()
    dependencies.requestsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        id: 'request-1',
        snapshotId: 'snapshot-1',
        status: requestStatus,
      }),
    )
    dependencies.recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        status: recipientStatus,
      }),
    )

    const result = await execute(dependencies)
    expect(result.status).toBe(expected)
    expect(result.hmsReference).toBe('request-1')
    if (expected === 'confirmed') {
      expect(result.protocol).toBe('PRO-123')
      expect(
        dependencies.protocolsRepository.findByRecipientAndRequest,
      ).toHaveBeenCalledWith({
        recipientId: 'recipient-1',
        requestId: 'request-1',
      })
    } else {
      expect(result).not.toHaveProperty('protocol')
      expect(
        dependencies.protocolsRepository.findByRecipientAndRequest,
      ).not.toHaveBeenCalled()
    }
  })

  it('never hard-codes submitted and reloads the exact request and recipient binding', async () => {
    const dependencies = makeDependencies()
    dependencies.requestsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        id: 'request-1',
        snapshotId: 'snapshot-1',
        status: 'sent',
      }),
    )
    dependencies.recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        status: 'reading',
      }),
    )

    await expect(execute(dependencies)).resolves.toEqual({
      status: 'reconciliation_pending',
      hmsReference: 'request-1',
    })
    expect(dependencies.requestsRepository.findById).toHaveBeenCalledWith('request-1')
    expect(dependencies.recipientsRepository.findById).toHaveBeenCalledWith('recipient-1')
  })

  it('rejects a missing or foreign protocol instead of exposing a false confirmation', async () => {
    const dependencies = makeDependencies()
    dependencies.requestsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        id: 'request-1',
        snapshotId: 'snapshot-1',
        status: 'confirmed',
      }),
    )
    dependencies.recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        status: 'confirmed',
      }),
    )
    dependencies.protocolsRepository.findByRecipientAndRequest.mockResolvedValue(null)
    await expect(execute(dependencies)).rejects.toThrow()

    dependencies.protocolsRepository.findByRecipientAndRequest.mockResolvedValue(
      fakeFormalizationSignatureProtocol({
        requestId: 'foreign-request',
        recipientId: 'recipient-1',
      }),
    )
    await expect(execute(dependencies)).rejects.toThrow()
  })

  it.each([
    { label: 'revoked', status: 'revoked' as const },
    { label: 'expired', status: 'expired' as const },
  ])('rejects an inactive $label result session', async ({ status }) => {
    const dependencies = makeDependencies()
    dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureGatewaySession({
        kind: 'result',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        deviceSecretHash: 'device-hash',
        expiresAt: new Date(NOW.getTime() + 60_000),
        status,
      }),
    )
    await expect(execute(dependencies)).rejects.toThrow()
    expect(dependencies.requestsRepository.findById).not.toHaveBeenCalled()
  })

  it('rejects an exactly expired or different-device result session', async () => {
    const dependencies = makeDependencies()
    dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureGatewaySession({
        kind: 'result',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        deviceSecretHash: 'device-hash',
        expiresAt: NOW,
      }),
    )
    await expect(execute(dependencies)).rejects.toThrow()

    dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureGatewaySession({
        kind: 'result',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        expiresAt: new Date(NOW.getTime() + 60_000),
      }),
    )
    await expect(
      new GetSignatureResultUseCase(dependencies).execute({
        sessionToken: 'result',
        deviceToken: 'other-device',
      }),
    ).rejects.toThrow()
  })
})
