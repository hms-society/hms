import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { fakeFormalization } from '../../domain/entities/fakers/formalization-faker'
import { fakeFormalizationSignatureRequest } from '../../domain/entities/fakers/formalization-signature-request-faker'
import { fakeFormalizationSignatureRequestDocument } from '../../domain/entities/fakers/formalization-signature-request-document-faker'
import { fakeFormalizationSignatureRecipient } from '../../domain/entities/fakers/formalization-signature-recipient-faker'
import type {
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationsRepository,
} from '../../interfaces'
import { GetFormalizationSignatureSendingStatusUseCase } from '../get-formalization-signature-sending-status-use-case'
import { FormalizationSignatureSendingForbiddenError } from '../../domain/errors'
import type { FormalizationSignatureSourceReader } from '../../interfaces'

describe('Get Formalization Signature Sending Status Use Case', () => {
  it('returns document progress and retry/cancel capabilities', async () => {
    const formalization = fakeFormalization()
    const signatureRequest = fakeFormalizationSignatureRequest({
      formalizationId: formalization.id,
      status: 'partially_submitted',
      version: 3,
    })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    const documentsRepository = mock<FormalizationSignatureRequestDocumentsRepository>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    requestsRepository.findLatestByFormalizationId.mockResolvedValue(signatureRequest)
    documentsRepository.listByRequestId.mockResolvedValue([
      fakeFormalizationSignatureRequestDocument({
        requestId: signatureRequest.id,
        status: 'confirmed',
      }),
      fakeFormalizationSignatureRequestDocument({
        requestId: signatureRequest.id,
        status: 'submitted',
      }),
      fakeFormalizationSignatureRequestDocument({
        requestId: signatureRequest.id,
        status: 'reconciliation_required',
      }),
      fakeFormalizationSignatureRequestDocument({
        requestId: signatureRequest.id,
        status: 'sent',
      }),
    ])

    await expect(
      new GetFormalizationSignatureSendingStatusUseCase({
        formalizationsRepository,
        requestsRepository,
        documentsRepository,
      }).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
      }),
    ).resolves.toMatchObject({
      requestId: signatureRequest.id,
      status: 'partially_submitted',
      version: 3,
      totalDocuments: 4,
      completedDocuments: 2,
      failedDocuments: 1,
      progressPercentage: 50,
      canCancel: true,
      canRetry: true,
    })
  })

  it('rejects an unknown or unauthorized Formalization', async () => {
    const formalizationsRepository = mock<FormalizationsRepository>()
    const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    const documentsRepository = mock<FormalizationSignatureRequestDocumentsRepository>()
    const useCase = new GetFormalizationSignatureSendingStatusUseCase({
      formalizationsRepository,
      requestsRepository,
      documentsRepository,
    })
    formalizationsRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ formalizationId: 'missing', actorId: 'actor' }),
    ).rejects.toBeInstanceOf(Error)

    const formalization = fakeFormalization()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    await expect(
      useCase.execute({ formalizationId: formalization.id, actorId: 'other' }),
    ).rejects.toBeInstanceOf(FormalizationSignatureSendingForbiddenError)
  })

  it.each([
    'reading',
    'submitted',
    'confirmed',
  ] as const)('allows tracking only for an active eligible linked collaborator in %s state', async (status) => {
    const formalization = fakeFormalization()
    const signatureRequest = fakeFormalizationSignatureRequest({
      formalizationId: formalization.id,
    })
    const recipient = fakeFormalizationSignatureRecipient({
      requestId: signatureRequest.id,
      personId: 'linked-collaborator',
      actorKind: 'collaborator',
      status,
    })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    const documentsRepository = mock<FormalizationSignatureRequestDocumentsRepository>()
    const sourceReader = mock<FormalizationSignatureSourceReader>()
    const recipients = mock<FormalizationSignatureRecipientsRepository>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    requestsRepository.findLatestByFormalizationId.mockResolvedValue(signatureRequest)
    recipients.listByRequestId.mockResolvedValue([recipient])
    documentsRepository.listByRequestId.mockResolvedValue([])
    sourceReader.findPerson.mockResolvedValue({
      personId: recipient.personId,
      name: recipient.displayNameSnapshot,
      profile: 'lawyer',
      availableChannels: [],
    })

    await expect(
      new GetFormalizationSignatureSendingStatusUseCase({
        formalizationsRepository,
        requestsRepository,
        documentsRepository,
        recipientsRepository: recipients,
        sourceReader,
      }).execute({
        formalizationId: formalization.id,
        actorId: recipient.personId,
      }),
    ).resolves.toMatchObject({
      viewerMode: 'tracking_only',
      permissions: { canOperate: false, canViewDocumentContent: false },
      canCancel: false,
      canRetry: false,
    })
  })

  it('rejects an unlinked collaborator even when the person is eligible', async () => {
    const formalization = fakeFormalization()
    const signatureRequest = fakeFormalizationSignatureRequest({
      formalizationId: formalization.id,
    })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    const documentsRepository = mock<FormalizationSignatureRequestDocumentsRepository>()
    const recipientsRepository = mock<FormalizationSignatureRecipientsRepository>()
    const sourceReader = mock<FormalizationSignatureSourceReader>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    requestsRepository.findLatestByFormalizationId.mockResolvedValue(signatureRequest)
    recipientsRepository.listByRequestId.mockResolvedValue([])
    await expect(
      new GetFormalizationSignatureSendingStatusUseCase({
        formalizationsRepository,
        requestsRepository,
        documentsRepository,
        recipientsRepository,
        sourceReader,
      }).execute({ formalizationId: formalization.id, actorId: 'unlinked' }),
    ).rejects.toBeInstanceOf(FormalizationSignatureSendingForbiddenError)
  })

  it('rejects a linked ineligible collaborator without loading tracking details', async () => {
    const formalization = fakeFormalization()
    const signatureRequest = fakeFormalizationSignatureRequest({
      formalizationId: formalization.id,
    })
    const recipient = fakeFormalizationSignatureRecipient({
      requestId: signatureRequest.id,
      personId: 'linked-ineligible',
      actorKind: 'collaborator',
    })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    const documentsRepository = mock<FormalizationSignatureRequestDocumentsRepository>()
    const recipientsRepository = mock<FormalizationSignatureRecipientsRepository>()
    const sourceReader = mock<FormalizationSignatureSourceReader>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    requestsRepository.findLatestByFormalizationId.mockResolvedValue(signatureRequest)
    recipientsRepository.listByRequestId.mockResolvedValue([recipient])
    sourceReader.findPerson.mockResolvedValue({
      personId: recipient.personId,
      name: recipient.displayNameSnapshot,
      profile: 'attendant',
      availableChannels: [],
    })

    await expect(
      new GetFormalizationSignatureSendingStatusUseCase({
        formalizationsRepository,
        requestsRepository,
        documentsRepository,
        recipientsRepository,
        sourceReader,
      }).execute({
        formalizationId: formalization.id,
        actorId: recipient.personId,
      }),
    ).rejects.toBeInstanceOf(FormalizationSignatureSendingForbiddenError)
    expect(documentsRepository.listByRequestId).not.toHaveBeenCalled()
  })

  it('allows an administrator to read sending progress', async () => {
    const formalization = fakeFormalization({ assignedLawyerId: 'lawyer-1' })
    const signatureRequest = fakeFormalizationSignatureRequest({
      formalizationId: formalization.id,
      status: 'sending',
    })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    const documentsRepository = mock<FormalizationSignatureRequestDocumentsRepository>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    requestsRepository.findLatestByFormalizationId.mockResolvedValue(signatureRequest)
    documentsRepository.listByRequestId.mockResolvedValue([])

    await expect(
      new GetFormalizationSignatureSendingStatusUseCase({
        formalizationsRepository,
        requestsRepository,
        documentsRepository,
      }).execute({
        formalizationId: formalization.id,
        actorId: 'admin-1',
        actorProfile: 'admin',
      }),
    ).resolves.toMatchObject({ requestId: signatureRequest.id, status: 'sending' })
  })

  it('exposes persisted cancellation state and locks operator cancellation after reload', async () => {
    const formalization = fakeFormalization()
    const cancellationRequestedAt = new Date('2026-09-01T10:00:00.000Z')
    const signatureRequest = fakeFormalizationSignatureRequest({
      formalizationId: formalization.id,
      status: 'reconciliation_required',
      cancellationRequestedAt,
    })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    const documentsRepository = mock<FormalizationSignatureRequestDocumentsRepository>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    requestsRepository.findLatestByFormalizationId.mockResolvedValue(signatureRequest)
    documentsRepository.listByRequestId.mockResolvedValue([])

    await expect(
      new GetFormalizationSignatureSendingStatusUseCase({
        formalizationsRepository,
        requestsRepository,
        documentsRepository,
      }).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
      }),
    ).resolves.toMatchObject({
      cancellationRequestedAt,
      canCancel: false,
    })
  })

  it('returns the completed progress of the latest confirmed request', async () => {
    const formalization = fakeFormalization()
    const signatureRequest = fakeFormalizationSignatureRequest({
      formalizationId: formalization.id,
      status: 'confirmed',
      version: 5,
    })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    const documentsRepository = mock<FormalizationSignatureRequestDocumentsRepository>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    requestsRepository.findLatestByFormalizationId.mockResolvedValue(signatureRequest)
    documentsRepository.listByRequestId.mockResolvedValue([
      fakeFormalizationSignatureRequestDocument({
        requestId: signatureRequest.id,
        status: 'confirmed',
      }),
      fakeFormalizationSignatureRequestDocument({
        requestId: signatureRequest.id,
        status: 'confirmed',
      }),
    ])

    await expect(
      new GetFormalizationSignatureSendingStatusUseCase({
        formalizationsRepository,
        requestsRepository,
        documentsRepository,
      }).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
      }),
    ).resolves.toMatchObject({
      formalizationId: formalization.id,
      formalizationStatus: formalization.status,
      formalizationVersion: formalization.version,
      requestId: signatureRequest.id,
      status: 'confirmed',
      version: 5,
      totalDocuments: 2,
      completedDocuments: 2,
      failedDocuments: 0,
      progressPercentage: 100,
      canCancel: false,
      canRetry: false,
      canConfirmContracting: false,
      viewerMode: 'operator',
      permissions: { canOperate: true, canViewDocumentContent: false },
      documents: expect.arrayContaining([
        expect.objectContaining({
          status: 'confirmed',
          signedArtifactAvailable: false,
          signatories: [],
        }),
      ]),
    })
  })
})
