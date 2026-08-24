import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentValidationDocumentFaker } from '../../domain/entities/fakers'
import {
  DocumentValidationDecision,
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '../../domain/structures'
import type {
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
} from '../../interfaces'
import { RecordDocumentValidationDecisionUseCase } from '../record-document-validation-decision-use-case'

describe('Record Document Validation Decision Use Case', () => {
  let documentValidationsRepository: MockProxy<DocumentValidationsRepository>
  let documentValidationLogsRepository: MockProxy<DocumentValidationLogsRepository>
  let useCase: RecordDocumentValidationDecisionUseCase

  beforeEach(() => {
    documentValidationsRepository = mock<DocumentValidationsRepository>()
    documentValidationLogsRepository = mock<DocumentValidationLogsRepository>()
    useCase = new RecordDocumentValidationDecisionUseCase(
      documentValidationsRepository,
      documentValidationLogsRepository,
    )
  })

  it('maps validate decision to validated status', async () => {
    const document = DocumentValidationDocumentFaker.fake({
      status: DocumentValidationStatus.Valid,
      aiSuggestion: {
        documentTypeId: 'comprovante_residencia',
        checklistItemId: 'residence-proof',
      },
    })
    documentValidationsRepository.findByFileId.mockResolvedValue(document)
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
    expect(documentValidationLogsRepository.add).toHaveBeenCalledWith({
      documentFileId: document.id,
      actorId: 'reviewer-id',
      action: DocumentValidationLogAction.DecisionRecorded,
      status: DocumentValidationStatus.Valid,
      decision: DocumentValidationDecision.Validate,
      metadata: {
        documentTypeId: 'comprovante_residencia',
        checklistRequirementId: 'residence-proof',
      },
    })
  })

  it('maps mismatch decision to not corresponding status', async () => {
    const document = DocumentValidationDocumentFaker.fake({
      status: DocumentValidationStatus.NotCorresponding,
    })
    documentValidationsRepository.findByFileId.mockResolvedValue(document)
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
    expect(documentValidationLogsRepository.add).toHaveBeenCalledWith({
      documentFileId: document.id,
      actorId: 'reviewer-id',
      action: DocumentValidationLogAction.DecisionRecorded,
      status: DocumentValidationStatus.NotCorresponding,
      decision: DocumentValidationDecision.Mismatch,
      reason: 'Documento enviado não corresponde ao checklist.',
      metadata: {},
    })
  })

  it('requires a reason when rejecting an incomplete document', async () => {
    const document = DocumentValidationDocumentFaker.fake()
    documentValidationsRepository.findByFileId.mockResolvedValue(document)

    await expect(
      useCase.execute({
        documentFileId: document.id,
        reviewedBy: 'reviewer-id',
        decision: DocumentValidationDecision.Incomplete,
      }),
    ).rejects.toThrow('O motivo é obrigatório')

    expect(documentValidationsRepository.recordDecision).not.toHaveBeenCalled()
    expect(documentValidationLogsRepository.add).not.toHaveBeenCalled()
  })

  it('records an AI correction log when the human decision changes the suggested status', async () => {
    const currentDocument = DocumentValidationDocumentFaker.fake({
      status: DocumentValidationStatus.Valid,
      aiSuggestion: {
        documentTypeId: 'comprovante_residencia',
        checklistItemId: 'residence-proof',
        checklistItemLabel: 'Comprovante de residência',
      },
    })
    const updatedDocument = DocumentValidationDocumentFaker.fake({
      status: DocumentValidationStatus.Incomplete,
    })
    documentValidationsRepository.findByFileId.mockResolvedValue(currentDocument)
    documentValidationsRepository.recordDecision.mockResolvedValue(updatedDocument)

    await useCase.execute({
      documentFileId: currentDocument.id,
      reviewedBy: 'reviewer-id',
      decision: DocumentValidationDecision.Incomplete,
      reason: 'Faltando verso do documento.',
    })

    expect(documentValidationLogsRepository.add).toHaveBeenNthCalledWith(2, {
      documentFileId: currentDocument.id,
      actorId: 'reviewer-id',
      action: DocumentValidationLogAction.AiCorrectionRecorded,
      status: DocumentValidationStatus.Incomplete,
      decision: DocumentValidationDecision.Incomplete,
      reason: 'Faltando verso do documento.',
      metadata: {
        errorType: 'status_correction',
        suggested: {
          status: DocumentValidationStatus.Valid,
          documentTypeId: 'comprovante_residencia',
          checklistItemId: 'residence-proof',
          checklistItemLabel: 'Comprovante de residência',
        },
        correction: {
          status: DocumentValidationStatus.Incomplete,
          decision: DocumentValidationDecision.Incomplete,
          documentTypeId: undefined,
          checklistRequirementId: undefined,
          originalDocumentId: undefined,
          reason: 'Faltando verso do documento.',
        },
      },
    })
  })
})
