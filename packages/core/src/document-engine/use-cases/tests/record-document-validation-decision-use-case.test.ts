import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import {
  ClientDocumentUploadFaker,
  DocumentValidationDocumentFaker,
} from '../../domain/entities/fakers'
import {
  DocumentValidationDecision,
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '../../domain/structures'
import type {
  CaseChecklistUpdateProvider,
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
  ClientDocumentUploadsRepository,
} from '../../interfaces'
import type { CaseAccessProvider } from '../../../case-management/interfaces/case-access-provider'
import type { GetDocumentValidationUseCase } from '../get-document-validation-use-case'
import { RecordDocumentValidationDecisionUseCase } from '../record-document-validation-decision-use-case'

describe('Record Document Validation Decision Use Case', () => {
  const checklistItemId = '00000000-0000-4000-8000-000000000702'

  let documentValidationsRepository: MockProxy<DocumentValidationsRepository>
  let documentValidationLogsRepository: MockProxy<DocumentValidationLogsRepository>
  let caseChecklistUpdateProvider: MockProxy<CaseChecklistUpdateProvider>
  let caseAccessProvider: MockProxy<CaseAccessProvider>
  let getDocumentValidation: MockProxy<GetDocumentValidationUseCase>
  let uploads: MockProxy<ClientDocumentUploadsRepository>
  let useCase: RecordDocumentValidationDecisionUseCase

  beforeEach(() => {
    uploads = mock<ClientDocumentUploadsRepository>()
    documentValidationsRepository = mock<DocumentValidationsRepository>()
    documentValidationLogsRepository = mock<DocumentValidationLogsRepository>()
    caseChecklistUpdateProvider = mock<CaseChecklistUpdateProvider>()
    caseAccessProvider = mock<CaseAccessProvider>()
    getDocumentValidation = mock<GetDocumentValidationUseCase>()
    getDocumentValidation.execute.mockImplementation(async ({ documentFileId }) => {
      const document = await documentValidationsRepository.findByFileId(documentFileId)
      if (!document) throw new Error('Document not found in test fixture')
      return document as ReturnType<typeof DocumentValidationDocumentFaker.fake>
    })
    useCase = new RecordDocumentValidationDecisionUseCase(
      documentValidationsRepository,
      documentValidationLogsRepository,
      caseAccessProvider,
      getDocumentValidation,
      caseChecklistUpdateProvider,
      uploads,
    )
  })

  it('maps validate decision to validated status', async () => {
    const document = DocumentValidationDocumentFaker.fake({
      status: DocumentValidationStatus.Valid,
      clientId: '00000000-0000-4000-8000-000000000700',
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
      actorId: 'collaborator-1',
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
      reason: undefined,
      metadata: {
        caseId: '00000000-0000-4000-8000-000000000701',
        documentTypeId: 'comprovante_residencia',
        checklistRequirementId: checklistItemId,
      },
    })
    expect(
      caseChecklistUpdateProvider.linkValidatedDocumentToChecklist,
    ).toHaveBeenCalledWith({
      caseId: '00000000-0000-4000-8000-000000000701',
      checklistItemId,
      documentFileId: document.id,
      documentFileName: document.fileName,
      clientId: '00000000-0000-4000-8000-000000000700',
      validatedBy: 'reviewer-id',
      actorId: 'collaborator-1',
    })
  })

  it('checks both the persisted owner and a different requested Case before recording', async () => {
    const ownerCaseId = '00000000-0000-4000-8000-000000000701'
    const targetCaseId = '00000000-0000-4000-8000-000000000704'
    const document = DocumentValidationDocumentFaker.fake({
      clientId: 'client-current',
      checklistLink: { caseId: ownerCaseId },
    })
    documentValidationsRepository.findByFileId.mockResolvedValue(document)
    documentValidationsRepository.recordDecision.mockResolvedValue(document)

    await useCase.execute({
      documentFileId: document.id,
      reviewedBy: 'reviewer-id',
      actorId: 'collaborator-1',
      decision: DocumentValidationDecision.Validate,
      caseId: targetCaseId,
    })

    expect(caseAccessProvider.authorize).toHaveBeenNthCalledWith(1, {
      caseId: ownerCaseId,
      actorId: 'collaborator-1',
      intent: 'write_content',
      expectedClientId: 'client-current',
    })
    expect(caseAccessProvider.authorize).toHaveBeenNthCalledWith(2, {
      caseId: targetCaseId,
      actorId: 'collaborator-1',
      intent: 'write_content',
      expectedClientId: 'client-current',
    })
    expect(caseAccessProvider.authorize.mock.invocationCallOrder[1]).toBeLessThan(
      documentValidationsRepository.recordDecision.mock.invocationCallOrder[0],
    )
  })

  it('does not record a decision after case write authorization fails', async () => {
    const document = DocumentValidationDocumentFaker.fake({
      checklistLink: {
        caseId: '00000000-0000-4000-8000-000000000701',
      },
    })
    documentValidationsRepository.findByFileId.mockResolvedValue(document)
    caseAccessProvider.authorize.mockRejectedValue(new Error('forbidden'))

    await expect(
      useCase.execute({
        documentFileId: document.id,
        reviewedBy: 'reviewer-id',
        actorId: 'collaborator-1',
        decision: DocumentValidationDecision.Validate,
      }),
    ).rejects.toThrow('forbidden')

    expect(documentValidationsRepository.recordDecision).not.toHaveBeenCalled()
    expect(documentValidationLogsRepository.add).not.toHaveBeenCalled()
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
      actorId: 'collaborator-1',
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
    ).toHaveBeenCalledWith({
      checklistItemId: undefined,
      documentFileId: document.id,
      validatedBy: 'reviewer-id',
      actorId: 'collaborator-1',
    })
  })

  it('fails the decision when the checklist synchronization fails', async () => {
    const document = DocumentValidationDocumentFaker.fake({
      status: DocumentValidationStatus.Valid,
      clientId: '00000000-0000-4000-8000-000000000700',
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
        actorId: 'collaborator-1',
        decision: DocumentValidationDecision.Validate,
        checklistRequirementId: checklistItemId,
      }),
    ).rejects.toThrow('checklist sync failed')

    expect(documentValidationsRepository.recordDecision).toHaveBeenCalledWith({
      documentFileId: document.id,
      reviewedBy: 'reviewer-id',
      decision: DocumentValidationDecision.Validate,
      caseId: '00000000-0000-4000-8000-000000000701',
      checklistRequirementId: checklistItemId,
      status: DocumentValidationStatus.Valid,
    })
  })

  it('delegates checklist synchronization when the validated document has no direct link', async () => {
    const document = DocumentValidationDocumentFaker.fake({
      status: DocumentValidationStatus.Valid,
    })
    documentValidationsRepository.findByFileId.mockResolvedValue(document)
    documentValidationsRepository.recordDecision.mockResolvedValue(document)

    await useCase.execute({
      documentFileId: document.id,
      reviewedBy: 'reviewer-id',
      actorId: 'collaborator-1',
      decision: DocumentValidationDecision.Validate,
    })

    expect(
      caseChecklistUpdateProvider.linkValidatedDocumentToChecklist,
    ).toHaveBeenCalledWith({
      checklistItemId: undefined,
      documentFileId: document.id,
      validatedBy: 'reviewer-id',
      actorId: 'collaborator-1',
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
      actorId: 'collaborator-1',
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
        actorId: 'collaborator-1',
        decision: DocumentValidationDecision.Incomplete,
      }),
    ).rejects.toThrow('O motivo é obrigatório')

    expect(documentValidationsRepository.recordDecision).not.toHaveBeenCalled()
    expect(documentValidationLogsRepository.add).not.toHaveBeenCalled()
  })

  it('does not record the duplicate decision again after it has already been reviewed', async () => {
    const document = DocumentValidationDocumentFaker.fake({
      status: DocumentValidationStatus.Duplicate,
      reviewedAt: new Date('2026-09-10T12:00:00.000Z'),
      duplicateMatch: {
        documentFileId: '00000000-0000-4000-8000-000000000703',
        fileName: 'documento-original.pdf',
        receivedAt: new Date('2026-09-09T12:00:00.000Z'),
      },
    })
    documentValidationsRepository.findByFileId.mockResolvedValue(document)

    const result = await useCase.execute({
      documentFileId: document.id,
      reviewedBy: 'reviewer-id',
      actorId: 'collaborator-1',
      decision: DocumentValidationDecision.Duplicate,
      originalDocumentId: '00000000-0000-4000-8000-000000000703',
    })

    expect(result).toEqual(document)
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
      actorId: 'collaborator-1',
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

  it('links an incomplete persisted checklist item and records the pending reason', async () => {
    const caseId = '00000000-0000-4000-8000-000000000701'
    const document = DocumentValidationDocumentFaker.fake({
      clientId: '00000000-0000-4000-8000-000000000700',
      checklistLink: { caseId, checklistItemId },
    })
    documentValidationsRepository.findByFileId.mockResolvedValue(document)
    documentValidationsRepository.recordDecision.mockResolvedValue(document)

    await useCase.execute({
      documentFileId: document.id,
      reviewedBy: 'reviewer-id',
      actorId: 'collaborator-1',
      decision: DocumentValidationDecision.Incomplete,
      reason: 'Faltam páginas.',
    })

    expect(
      caseChecklistUpdateProvider.linkPendingDocumentToChecklist,
    ).toHaveBeenCalledWith({
      caseId,
      checklistItemId,
      documentFileId: document.id,
      documentFileName: document.fileName,
      actorId: 'collaborator-1',
    })
    expect(caseChecklistUpdateProvider.createDocumentPending).toHaveBeenCalledWith({
      caseId,
      checklistItemId,
      documentFileId: document.id,
      documentFileName: document.fileName,
      reason: 'incomplete',
      details: 'Faltam páginas.',
      responsibleId: 'reviewer-id',
      actorId: 'collaborator-1',
    })
  })

  it('rejects duplicate decisions without an original document before writes', async () => {
    const document = DocumentValidationDocumentFaker.fake()
    documentValidationsRepository.findByFileId.mockResolvedValue(document)

    await expect(
      useCase.execute({
        documentFileId: document.id,
        reviewedBy: 'reviewer-id',
        actorId: 'collaborator-1',
        decision: DocumentValidationDecision.Duplicate,
      }),
    ).rejects.toThrow('O documento original é obrigatório')

    expect(documentValidationsRepository.recordDecision).not.toHaveBeenCalled()
  })
  it('rejects Motor validation of an unpublished checklist upload before all mutation', async () => {
    const document = DocumentValidationDocumentFaker.fake()
    documentValidationsRepository.findByFileId.mockResolvedValue(document)
    uploads.findByStoragePath.mockResolvedValue(
      ClientDocumentUploadFaker.fake({ storagePath: document.storagePath }),
    )
    await expect(
      useCase.execute({
        documentFileId: document.id,
        actorId: 'actor',
        reviewedBy: 'reviewer',
        decision: DocumentValidationDecision.Validate,
      }),
    ).rejects.toThrow('Valide o documento pelo item do checklist')
    expect(documentValidationsRepository.recordDecision).not.toHaveBeenCalled()
    expect(documentValidationLogsRepository.add).not.toHaveBeenCalled()
    expect(
      caseChecklistUpdateProvider.linkValidatedDocumentToChecklist,
    ).not.toHaveBeenCalled()
  })
})
