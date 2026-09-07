import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentValidationDocumentFaker } from '../../domain/entities/fakers'
import {
  DocumentValidationDecision,
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '../../domain/structures'
import type {
  CaseChecklistUpdateProvider,
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
} from '../../interfaces'
import { RecordDocumentValidationDecisionUseCase } from '../record-document-validation-decision-use-case'

describe('Record Document Validation Decision Use Case', () => {
  const checklistItemId = '00000000-0000-4000-8000-000000000702'

  let documentValidationsRepository: MockProxy<DocumentValidationsRepository>
  let documentValidationLogsRepository: MockProxy<DocumentValidationLogsRepository>
  let caseChecklistUpdateProvider: MockProxy<CaseChecklistUpdateProvider>
  let useCase: RecordDocumentValidationDecisionUseCase

  beforeEach(() => {
    documentValidationsRepository = mock<DocumentValidationsRepository>()
    documentValidationLogsRepository = mock<DocumentValidationLogsRepository>()
    caseChecklistUpdateProvider = mock<CaseChecklistUpdateProvider>()
    useCase = new RecordDocumentValidationDecisionUseCase(
      documentValidationsRepository,
      documentValidationLogsRepository,
      caseChecklistUpdateProvider,
    )
  })

  it('maps validate decision to validated status', async () => {
    const document = DocumentValidationDocumentFaker.fake({
      status: DocumentValidationStatus.Valid,
      aiSuggestion: {
        documentTypeId: 'comprovante_residencia',
        checklistItemId: 'residence-proof',
      },
      checklistLink: {
        caseId: '00000000-0000-4000-8000-000000000701',
        checklistItemId,
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
      caseId: '00000000-0000-4000-8000-000000000701',
      documentTypeId: 'comprovante_residencia',
      checklistRequirementId: checklistItemId,
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
        checklistRequirementId: checklistItemId,
      },
    })
    expect(
      caseChecklistUpdateProvider.linkValidatedDocumentToChecklist,
    ).toHaveBeenCalledWith({
      checklistItemId,
      documentFileId: document.id,
      validatedBy: 'reviewer-id',
    })
  })

  it('does not update the case checklist when the selected checklist value is not a persisted item id', async () => {
    const document = DocumentValidationDocumentFaker.fake({
      status: DocumentValidationStatus.Valid,
      aiSuggestion: {
        checklistItemId: 'Documento teste 1',
      },
    })
    documentValidationsRepository.findByFileId.mockResolvedValue(document)
    documentValidationsRepository.recordDecision.mockResolvedValue(document)

    await useCase.execute({
      documentFileId: document.id,
      reviewedBy: 'reviewer-id',
      decision: DocumentValidationDecision.Validate,
      documentTypeId: 'documento-teste',
      checklistRequirementId: 'Documento teste 1',
    })

    expect(documentValidationsRepository.recordDecision).toHaveBeenCalledWith({
      documentFileId: document.id,
      reviewedBy: 'reviewer-id',
      decision: DocumentValidationDecision.Validate,
      caseId: undefined,
      documentTypeId: 'documento-teste',
      checklistRequirementId: 'Documento teste 1',
      status: DocumentValidationStatus.Valid,
    })
    expect(
      caseChecklistUpdateProvider.linkValidatedDocumentToChecklist,
    ).not.toHaveBeenCalled()
  })

  it('keeps the document decision recorded when the checklist synchronization fails', async () => {
    const document = DocumentValidationDocumentFaker.fake({
      status: DocumentValidationStatus.Valid,
      checklistLink: {
        caseId: '00000000-0000-4000-8000-000000000701',
        checklistItemId,
      },
    })
    documentValidationsRepository.findByFileId.mockResolvedValue(document)
    documentValidationsRepository.recordDecision.mockResolvedValue(document)
    caseChecklistUpdateProvider.linkValidatedDocumentToChecklist.mockRejectedValue(
      new Error('checklist sync failed'),
    )

    await expect(
      useCase.execute({
        documentFileId: document.id,
        reviewedBy: 'reviewer-id',
        decision: DocumentValidationDecision.Validate,
        checklistRequirementId: checklistItemId,
      }),
    ).resolves.toEqual(document)

    expect(documentValidationsRepository.recordDecision).toHaveBeenCalledWith({
      documentFileId: document.id,
      reviewedBy: 'reviewer-id',
      decision: DocumentValidationDecision.Validate,
      caseId: '00000000-0000-4000-8000-000000000701',
      checklistRequirementId: checklistItemId,
      status: DocumentValidationStatus.Valid,
    })
  })

  it('does not update the case checklist when the validated document has no checklist link', async () => {
    const document = DocumentValidationDocumentFaker.fake({
      status: DocumentValidationStatus.Valid,
    })
    documentValidationsRepository.findByFileId.mockResolvedValue(document)
    documentValidationsRepository.recordDecision.mockResolvedValue(document)

    await useCase.execute({
      documentFileId: document.id,
      reviewedBy: 'reviewer-id',
      decision: DocumentValidationDecision.Validate,
    })

    expect(
      caseChecklistUpdateProvider.linkValidatedDocumentToChecklist,
    ).not.toHaveBeenCalled()
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
      caseId: undefined,
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
