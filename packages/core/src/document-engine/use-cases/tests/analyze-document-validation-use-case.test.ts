import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DocumentValidationDocument } from '../../domain/entities'
import {
  DocumentBatchChannel,
  DocumentValidationStatus,
} from '../../domain/structures'
import { DocumentFileNotFoundError } from '../../domain/errors'
import type {
  DocumentValidationAnalyzerProvider,
  DocumentValidationsRepository,
} from '../../interfaces'
import { AnalyzeDocumentValidationUseCase } from '../analyze-document-validation-use-case'

describe('Analyze Document Validation Use Case', () => {
  let documentValidationsRepository: MockProxy<DocumentValidationsRepository>
  let documentValidationAnalyzerProvider: MockProxy<DocumentValidationAnalyzerProvider>
  let useCase: AnalyzeDocumentValidationUseCase

  beforeEach(() => {
    documentValidationsRepository = mock<DocumentValidationsRepository>()
    documentValidationAnalyzerProvider = mock<DocumentValidationAnalyzerProvider>()
    useCase = new AnalyzeDocumentValidationUseCase(
      documentValidationsRepository,
      documentValidationAnalyzerProvider,
    )
  })

  it('records the analyzer result for an existing document', async () => {
    const document = fakeDocumentValidationDocument()
    const analyzedDocument = fakeDocumentValidationDocument({
      status: DocumentValidationStatus.Valid,
      aiConfidence: 96,
    })

    documentValidationsRepository.findByFileId.mockResolvedValue(document)
    documentValidationAnalyzerProvider.analyze.mockResolvedValue({
      status: DocumentValidationStatus.Valid,
      aiConfidence: 96,
      extractedFields: [{ label: 'Titular', value: 'Mariana Costa Silva' }],
      missingFields: [],
      aiSuggestion: { caseLabel: 'Caso 0089' },
    })
    documentValidationsRepository.recordAnalysis.mockResolvedValue(analyzedDocument)

    const result = await useCase.execute({ documentFileId: document.id })

    expect(result).toEqual(analyzedDocument)
    expect(documentValidationAnalyzerProvider.analyze).toHaveBeenCalledWith(document)
    expect(documentValidationsRepository.recordAnalysis).toHaveBeenCalledWith({
      documentFileId: document.id,
      status: DocumentValidationStatus.Valid,
      aiConfidence: 96,
      extractedFields: [{ label: 'Titular', value: 'Mariana Costa Silva' }],
      missingFields: [],
      aiSuggestion: { caseLabel: 'Caso 0089' },
    })
  })

  it('throws when the document does not exist', async () => {
    documentValidationsRepository.findByFileId.mockResolvedValue(undefined)

    await expect(
      useCase.execute({ documentFileId: 'missing-document-file-id' }),
    ).rejects.toThrow(DocumentFileNotFoundError)
    expect(documentValidationAnalyzerProvider.analyze).not.toHaveBeenCalled()
    expect(documentValidationsRepository.recordAnalysis).not.toHaveBeenCalled()
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
