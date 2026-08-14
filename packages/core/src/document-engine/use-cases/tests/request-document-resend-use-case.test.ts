import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DocumentValidationDocument } from '../../domain/entities'
import {
  DocumentBatchChannel,
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '../../domain/structures'
import type {
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
} from '../../interfaces'
import { RequestDocumentResendUseCase } from '../request-document-resend-use-case'

describe('Request Document Resend Use Case', () => {
  let documentValidationsRepository: MockProxy<DocumentValidationsRepository>
  let documentValidationLogsRepository: MockProxy<DocumentValidationLogsRepository>
  let useCase: RequestDocumentResendUseCase

  beforeEach(() => {
    documentValidationsRepository = mock<DocumentValidationsRepository>()
    documentValidationLogsRepository = mock<DocumentValidationLogsRepository>()
    useCase = new RequestDocumentResendUseCase(
      documentValidationsRepository,
      documentValidationLogsRepository,
    )
  })

  it('records the resend request message in the validation log', async () => {
    const document = fakeDocumentValidationDocument({
      status: DocumentValidationStatus.ResendRequested,
    })
    documentValidationsRepository.recordResendRequest.mockResolvedValue(document)

    const result = await useCase.execute({
      documentFileId: document.id,
      reviewedBy: 'reviewer-id',
      reason: 'Campos obrigatórios ausentes.',
      message: 'Olá, envie novamente com todos os campos obrigatórios.',
    })

    expect(result).toEqual(document)
    expect(documentValidationLogsRepository.add).toHaveBeenCalledWith({
      documentFileId: document.id,
      actorId: 'reviewer-id',
      action: DocumentValidationLogAction.ResendRequested,
      status: DocumentValidationStatus.ResendRequested,
      reason: 'Campos obrigatórios ausentes.',
      message: 'Olá, envie novamente com todos os campos obrigatórios.',
    })
  })
})

function fakeDocumentValidationDocument(
  overrides: Partial<DocumentValidationDocument> = {},
): DocumentValidationDocument {
  return {
    id: 'document-file-id',
    batchId: 'document-batch-id',
    fileName: 'comprovante-residencia.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    storagePath: 'seed/document.pdf',
    status: DocumentValidationStatus.AwaitingValidation,
    channel: DocumentBatchChannel.InternalUpload,
    sender: 'lawyer@hms.com',
    receivedAt: new Date('2026-08-14T12:00:00.000Z'),
    createdAt: new Date('2026-08-14T12:00:00.000Z'),
    extractedFields: [],
    missingFields: [],
    ...overrides,
  }
}
