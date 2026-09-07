import { describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { DatetimeProvider, IdProvider } from '../../../shared/interfaces'
import {
  fakeFormalizationSignatureGatewaySession,
  fakeFormalizationSignatureInvitation,
  fakeFormalizationSignatureRecipient,
  fakeFormalizationSignatureRequest,
} from '../../domain/entities/fakers'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSourceReader,
  SignatureSecretHasher,
} from '../../interfaces'
import { EstablishCollaboratorSigningSessionUseCase } from '../establish-collaborator-signing-session-use-case'

const NOW = new Date('2026-09-02T20:00:00.000Z')

type Dependencies = {
  sessionsRepository: MockProxy<FormalizationSignatureGatewaySessionsRepository>
  invitationsRepository: MockProxy<FormalizationSignatureInvitationsRepository>
  recipientsRepository: MockProxy<FormalizationSignatureRecipientsRepository>
  requestsRepository: MockProxy<FormalizationSignatureRequestsRepository>
  assignmentsRepository: MockProxy<FormalizationSignatureRecipientDocumentsRepository>
  sourceReader: MockProxy<FormalizationSignatureSourceReader>
  transaction: MockProxy<FormalizationSignatureGatewayTransaction>
  idProvider: MockProxy<IdProvider>
  datetimeProvider: MockProxy<DatetimeProvider>
  hasher: MockProxy<SignatureSecretHasher>
}

function makeDependencies(): Dependencies {
  const dependencies: Dependencies = {
    sessionsRepository: mock<FormalizationSignatureGatewaySessionsRepository>(),
    invitationsRepository: mock<FormalizationSignatureInvitationsRepository>(),
    recipientsRepository: mock<FormalizationSignatureRecipientsRepository>(),
    requestsRepository: mock<FormalizationSignatureRequestsRepository>(),
    assignmentsRepository: mock<FormalizationSignatureRecipientDocumentsRepository>(),
    sourceReader: mock<FormalizationSignatureSourceReader>(),
    transaction: mock<FormalizationSignatureGatewayTransaction>(),
    idProvider: mock<IdProvider>(),
    datetimeProvider: mock<DatetimeProvider>(),
    hasher: mock<SignatureSecretHasher>(),
  }
  dependencies.datetimeProvider.now.mockReturnValue(NOW)
  dependencies.hasher.hash.mockImplementation((value) => `${value}-hash`)
  dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
    fakeFormalizationSignatureGatewaySession({
      id: 'flow-session',
      requestId: 'request-1',
      recipientId: 'recipient-1',
      snapshotId: 'snapshot-1',
      kind: 'flow',
      status: 'active',
      tokenHash: 'flow-token-hash',
      deviceSecretHash: 'device-hash',
      csrfHash: 'csrf-hash',
      expiresAt: new Date(NOW.getTime() + 60_000),
    }),
  )
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
      personId: 'collaborator-1',
      actorKind: 'collaborator',
      status: 'authenticating',
    }),
  )
  dependencies.invitationsRepository.findActiveByRecipientId.mockResolvedValue(
    fakeFormalizationSignatureInvitation({
      id: 'invitation-1',
      requestId: 'request-1',
      recipientId: 'recipient-1',
      status: 'active',
      generation: 1,
      expiresAt: new Date(NOW.getTime() + 60_000),
    }),
  )
  dependencies.sessionsRepository.findActiveByRecipientId.mockResolvedValue([])
  dependencies.transaction.establishCollaboratorSession.mockResolvedValue('applied')
  dependencies.assignmentsRepository.listByRecipientId.mockResolvedValue([
    {
      id: 'assignment-1',
      requestId: 'request-1',
      recipientId: 'recipient-1',
      requestDocumentId: 'document-1',
      createdAt: NOW,
    },
  ])
  dependencies.sourceReader.findAuthenticationSource.mockResolvedValue({
    personId: 'collaborator-1',
    actorKind: 'collaborator',
    active: true,
    collaboratorRole: 'lawyer',
    channels: [],
  })
  dependencies.idProvider.generate
    .mockReturnValueOnce('authenticated-token')
    .mockReturnValueOnce('authenticated-device')
    .mockReturnValueOnce('authenticated-csrf')
    .mockReturnValueOnce('authenticated-session')
  return dependencies
}

function execute(dependencies: Dependencies, actorId = 'collaborator-1') {
  return new EstablishCollaboratorSigningSessionUseCase(dependencies).execute({
    flowToken: 'flow-token',
    deviceToken: 'device',
    actorId,
    csrfToken: 'csrf',
  })
}

describe('Establish Collaborator Signing Session Use Case', () => {
  it('binds the new session to the exact flow, request, recipient, snapshot and assignment', async () => {
    const dependencies = makeDependencies()
    await expect(execute(dependencies)).resolves.toEqual({
      authenticatedToken: 'authenticated-token',
      deviceToken: 'authenticated-device',
      csrfToken: 'authenticated-csrf',
      expiresAt: new Date('2026-09-03T20:00:00.000Z'),
    })
    expect(dependencies.requestsRepository.findById).toHaveBeenCalledWith('request-1')
    expect(dependencies.assignmentsRepository.listByRecipientId).toHaveBeenCalledWith(
      'recipient-1',
    )
    expect(dependencies.transaction.establishCollaboratorSession).toHaveBeenCalledWith(
      expect.objectContaining({
        invitationId: 'invitation-1',
        flowSessionId: 'flow-session',
        recipientChanges: { status: 'authenticated' },
        authenticatedSession: expect.objectContaining({
          id: 'authenticated-session',
          kind: 'authenticated',
          requestId: 'request-1',
          recipientId: 'recipient-1',
          snapshotId: 'snapshot-1',
          tokenHash: 'authenticated-token-hash',
          deviceSecretHash: 'authenticated-device-hash',
          issuedAt: NOW,
        }),
      }),
    )
  })

  it('authenticates a recoverable invitation consumed by the previous policy', async () => {
    const dependencies = makeDependencies()
    dependencies.invitationsRepository.findActiveByRecipientId.mockResolvedValue(null)
    dependencies.invitationsRepository.findConsumedByRecipientAndRequest.mockResolvedValue(
      fakeFormalizationSignatureInvitation({
        id: 'invitation-1',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        status: 'consumed',
        generation: 1,
        expiresAt: new Date(NOW.getTime() + 60_000),
      }),
    )

    await expect(execute(dependencies)).resolves.toBeDefined()
    expect(
      dependencies.invitationsRepository.findConsumedByRecipientAndRequest,
    ).toHaveBeenCalledWith({ recipientId: 'recipient-1', requestId: 'request-1' })
    expect(dependencies.transaction.establishCollaboratorSession).toHaveBeenCalledOnce()
  })

  it('recovers a collaborator whose provider observation advanced to signing', async () => {
    const dependencies = makeDependencies()
    dependencies.recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        personId: 'collaborator-1',
        actorKind: 'collaborator',
        status: 'signing',
      }),
    )

    await expect(execute(dependencies)).resolves.toBeDefined()
    expect(dependencies.transaction.establishCollaboratorSession).toHaveBeenCalledWith(
      expect.objectContaining({ recipientChanges: { status: 'authenticated' } }),
    )
  })

  it('authenticates the collaborator while invitation delivery is still converging', async () => {
    const dependencies = makeDependencies()
    dependencies.requestsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        id: 'request-1',
        snapshotId: 'snapshot-1',
        status: 'sending',
      }),
    )

    await expect(execute(dependencies)).resolves.toBeDefined()
    expect(dependencies.transaction.establishCollaboratorSession).toHaveBeenCalledWith(
      expect.objectContaining({ requestChanges: { status: 'in_progress' } }),
    )
  })

  it.each([
    {
      label: 'expired session',
      configure: (d: Dependencies) =>
        d.sessionsRepository.findByTokenHash.mockResolvedValue(
          fakeFormalizationSignatureGatewaySession({ kind: 'flow', expiresAt: NOW }),
        ),
    },
    {
      label: 'terminal request',
      configure: (d: Dependencies) =>
        d.requestsRepository.findById.mockResolvedValue(
          fakeFormalizationSignatureRequest({
            id: 'request-1',
            snapshotId: 'snapshot-1',
            status: 'cancelled',
          }),
        ),
    },
    {
      label: 'stale request',
      configure: (d: Dependencies) =>
        d.requestsRepository.findById.mockResolvedValue(
          fakeFormalizationSignatureRequest({
            id: 'request-1',
            snapshotId: 'other-snapshot',
            status: 'sent',
          }),
        ),
    },
    {
      label: 'foreign recipient',
      configure: (d: Dependencies) =>
        d.recipientsRepository.findById.mockResolvedValue(
          fakeFormalizationSignatureRecipient({
            id: 'other-recipient',
            requestId: 'request-1',
            personId: 'collaborator-1',
            actorKind: 'collaborator',
            status: 'authenticating',
          }),
        ),
    },
    {
      label: 'missing assignment',
      configure: (d: Dependencies) =>
        d.assignmentsRepository.listByRecipientId.mockResolvedValue([]),
    },
  ])('rejects a $label flow state without creating a session', async ({ configure }) => {
    const dependencies = makeDependencies()
    configure(dependencies)
    await expect(execute(dependencies)).rejects.toThrow()
    expect(dependencies.transaction.establishCollaboratorSession).not.toHaveBeenCalled()
  })

  it.each([
    { label: 'wrong person', actorId: 'different-collaborator' },
    { label: 'inactive profile', actorId: 'collaborator-1', active: false },
    {
      label: 'wrong profile kind',
      actorId: 'collaborator-1',
      actorKind: 'client' as const,
    },
    {
      label: 'missing permitted profile',
      actorId: 'collaborator-1',
      collaboratorRole: undefined,
    },
  ])('rejects a $label live collaborator identity', async ({
    actorId,
    active,
    actorKind,
    collaboratorRole,
  }) => {
    const dependencies = makeDependencies()
    if (active !== undefined || actorKind || collaboratorRole === undefined)
      dependencies.sourceReader.findAuthenticationSource.mockResolvedValue({
        personId: 'collaborator-1',
        actorKind: actorKind ?? 'collaborator',
        active: active ?? true,
        ...(collaboratorRole === undefined ? {} : { collaboratorRole }),
        channels: [],
      })
    await expect(execute(dependencies, actorId)).rejects.toThrow()
    expect(dependencies.transaction.establishCollaboratorSession).not.toHaveBeenCalled()
  })

  it('rejects a flow with an invalid device or csrf secret before reading identity', async () => {
    const dependencies = makeDependencies()
    await expect(
      new EstablishCollaboratorSigningSessionUseCase(dependencies).execute({
        flowToken: 'flow-token',
        deviceToken: 'wrong-device',
        actorId: 'collaborator-1',
        csrfToken: 'csrf',
      }),
    ).rejects.toThrow()
    expect(dependencies.recipientsRepository.findById).not.toHaveBeenCalled()

    await expect(
      new EstablishCollaboratorSigningSessionUseCase(dependencies).execute({
        flowToken: 'flow-token',
        deviceToken: 'device',
        actorId: 'collaborator-1',
        csrfToken: 'wrong-csrf',
      }),
    ).rejects.toThrow()
  })
})
