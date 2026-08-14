import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DocumentValidationDocument } from '../../domain/entities'
import {
  DocumentBatchChannel,
  DocumentValidationDecision,
  DocumentValidationStatus,
} from '../../domain/structures'
import type { DocumentValidationsRepository } from '../../interfaces'
import { RecordDocumentValidationDecisionUseCase } from '../record-document-validation-decision-use-case'

describe('Record Document Validation Decision Use Case', () => {
  let documentValidationsRepository: MockProxy<DocumentValidationsRepository>
  let useCase: RecordDocumentValidationDecisionUseCase

  beforeEach(() => {
    documentValidationsRepository = mock<DocumentValidationsRepository>()
    useCase = new RecordDocumentValidationDecisionUseCase(
      documentValidationsRepository,
    )
  })

  it('maps validate decision to validated status', async () => {
    const document = fakeDocumentValidationDocument({
      status: DocumentValidationStatus.Valid,
    })
    documentValidationsRepository.recordDecision.mockResolvedValue(document)

    const result = await useCase.execute({
      documentFileId: document.id,
      reviewedBy: 'reviewer-id',
      decision: DocumentValidationDecision.Validate,
      documentTypeId: 'comprovante_residencia',
      checklistRequirementId: 'residence-proof',
    })

    expect(result).toEqual(document)
    expect(documentValidationsRepository.recordDecision).toHaveBeenCalledWith({
      documentFileId: document.id,
      reviewedBy: 'reviewer-id',
      decision: DocumentValidationDecision.Validate,
      documentTypeId: 'comprovante_residencia',
      checklistRequirementId: 'residence-proof',
      status: DocumentValidationStatus.Valid,
    })
  })

  it('maps mismatch decision to not corresponding status', async () => {
    const document = fakeDocumentValidationDocument({
      status: DocumentValidationStatus.NotCorresponding,
    })
    documentValidationsRepository.recordDecision.mockResolvedValue(document)

    await useCase.execute({
      documentFileId: document.id,
      reviewedBy: 'reviewer-id',
      decision: DocumentValidationDecision.Mismatch,
      reason: 'Documento enviado não corresponde ao checklist.',
    })

    expect(documentValidationsRepository.recordDecision).toHaveBeenCalledWith({
      documentFileId: document.id,
      reviewedBy: 'reviewer-id',
      decision: DocumentValidationDecision.Mismatch,
      reason: 'Documento enviado não corresponde ao checklist.',
      status: DocumentValidationStatus.NotCorresponding,
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
