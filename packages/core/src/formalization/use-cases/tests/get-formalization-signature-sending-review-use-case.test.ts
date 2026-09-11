import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { fakeFormalization } from '../../domain/entities/fakers/formalization-faker'
import { fakeFormalizationSignatureRequest } from '../../domain/entities/fakers/formalization-signature-request-faker'
import { fakeFormalizationSignatureRequestDocument } from '../../domain/entities/fakers/formalization-signature-request-document-faker'
import type {
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureDocumentMetadataReader,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSourceReader,
  FormalizationsRepository,
} from '../../interfaces'
import { GetFormalizationSignatureSendingReviewUseCase } from '../get-formalization-signature-sending-review-use-case'

function makeDependencies() {
  return {
    formalizationsRepository: mock<FormalizationsRepository>(),
    configurationRepository: mock<FormalizationSignatureConfigurationRepository>(),
    sourceReader: mock<FormalizationSignatureSourceReader>(),
    metadataReader: mock<FormalizationSignatureDocumentMetadataReader>(),
    requestsRepository: mock<FormalizationSignatureRequestsRepository>(),
    documentsRepository: mock<FormalizationSignatureRequestDocumentsRepository>(),
  }
}

describe('Get Formalization Signature Sending Review Use Case', () => {
  it('exposes the contracted execute operation', () => {
    expect(GetFormalizationSignatureSendingReviewUseCase).toBeTypeOf('function')
    expect(GetFormalizationSignatureSendingReviewUseCase.prototype.execute).toBeTypeOf(
      'function',
    )
  })

  it('allows an authorized administrator to review another lawyer’s Formalization', async () => {
    const dependencies = makeDependencies()
    const formalization = fakeFormalization({
      id: 'formalization-1',
      assignedLawyerId: 'lawyer-1',
    })
    dependencies.formalizationsRepository.findById.mockResolvedValue(formalization)
    dependencies.configurationRepository.findByFormalizationId.mockResolvedValue({
      formalizationId: formalization.id,
      version: 3,
      editable: true,
      status: 'ready_for_sending',
      previewPreparation: { total: 1, pending: 0, processing: 0, ready: 1, failed: 0 },
      signatories: [],
      documents: [
        {
          documentId: 'document-1',
          documentVersionId: 'version-1',
          name: 'Contract',
          reviewStatus: 'approved',
          preview: { previewId: 'preview-1', state: 'ready', pages: [], pageCount: 1 },
          fields: [],
        },
      ],
      readiness: { ready: true, assignmentCount: 0, issues: [] },
    })
    dependencies.metadataReader.findMetadata.mockResolvedValue({
      privateFileId: 'private-file-1',
      sha256: 'a'.repeat(64),
      byteCount: 100,
    })
    const currentRequest = fakeFormalizationSignatureRequest({
      formalizationId: formalization.id,
      status: 'sent',
      version: 4,
    })
    dependencies.requestsRepository.findLatestByFormalizationId.mockResolvedValue(
      currentRequest,
    )
    dependencies.documentsRepository.listByRequestId.mockResolvedValue([
      fakeFormalizationSignatureRequestDocument({
        requestId: currentRequest.id,
        status: 'sent',
      }),
    ])

    await expect(
      new GetFormalizationSignatureSendingReviewUseCase(dependencies).execute({
        formalizationId: formalization.id,
        actorId: 'admin-1',
        actorProfile: 'admin',
      }),
    ).resolves.toMatchObject({
      ready: true,
      formalizationId: formalization.id,
      currentRequest: {
        id: currentRequest.id,
        status: 'sent',
        version: 4,
        signatureConfigurationVersion: currentRequest.signatureConfigurationVersion,
        openDocuments: 1,
        totalDocuments: 1,
      },
    })
  })

  it('rejects a non-assigned non-administrator from the review', async () => {
    const dependencies = makeDependencies()
    const formalization = fakeFormalization({ assignedLawyerId: 'lawyer-1' })
    dependencies.formalizationsRepository.findById.mockResolvedValue(formalization)

    await expect(
      new GetFormalizationSignatureSendingReviewUseCase(dependencies).execute({
        formalizationId: formalization.id,
        actorId: 'other-actor',
        actorProfile: 'lawyer',
      }),
    ).rejects.toThrow()
  })
})
