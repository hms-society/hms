import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { fakeFormalization } from '../../domain/entities/fakers/formalization-faker'
import { fakeFormalizationSignatureRequest } from '../../domain/entities/fakers/formalization-signature-request-faker'
import { fakeFormalizationSignatureRequestDocument } from '../../domain/entities/fakers/formalization-signature-request-document-faker'
import type {
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationsRepository,
} from '../../interfaces'
import { GetFormalizationSignatureSendingStatusUseCase } from '../get-formalization-signature-sending-status-use-case'

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
      totalDocuments: 3,
      completedDocuments: 1,
      failedDocuments: 1,
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
    ).rejects.toThrow()

    const formalization = fakeFormalization()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    await expect(
      useCase.execute({ formalizationId: formalization.id, actorId: 'other' }),
    ).rejects.toThrow()
    expect(requestsRepository.findLatestByFormalizationId).not.toHaveBeenCalled()
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
    ).resolves.toEqual({
      requestId: signatureRequest.id,
      status: 'confirmed',
      version: 5,
      totalDocuments: 2,
      completedDocuments: 2,
      failedDocuments: 0,
      canCancel: false,
      canRetry: false,
    })
  })
})
