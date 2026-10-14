import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentValidationDocumentFaker } from '../../domain/entities/fakers'
import { DocumentFileNotFoundError } from '../../domain/errors'
import {
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '../../domain/structures'
import type {
  CaseChecklistUpdateProvider,
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
} from '../../interfaces'
import type { CaseAccessProvider } from '../../../case-management/interfaces/case-access-provider'
import type { GetDocumentValidationUseCase } from '../get-document-validation-use-case'
import { RequestDocumentResendUseCase } from '../request-document-resend-use-case'

describe('Request Document Resend Use Case', () => {
  let documentValidationsRepository: MockProxy<DocumentValidationsRepository>
  let documentValidationLogsRepository: MockProxy<DocumentValidationLogsRepository>
  let caseChecklistUpdateProvider: MockProxy<CaseChecklistUpdateProvider>
  let caseAccessProvider: MockProxy<CaseAccessProvider>
  let getDocumentValidation: MockProxy<GetDocumentValidationUseCase>
  let useCase: RequestDocumentResendUseCase

  beforeEach(() => {
    documentValidationsRepository = mock<DocumentValidationsRepository>()
    documentValidationLogsRepository = mock<DocumentValidationLogsRepository>()
    caseChecklistUpdateProvider = mock<CaseChecklistUpdateProvider>()
    caseAccessProvider = mock<CaseAccessProvider>()
    getDocumentValidation = mock<GetDocumentValidationUseCase>()
    useCase = new RequestDocumentResendUseCase(
      documentValidationsRepository,
      documentValidationLogsRepository,
      caseAccessProvider,
      getDocumentValidation,
      caseChecklistUpdateProvider,
    )
  })

  it('records the resend request message in the validation log', async () => {
    const document = DocumentValidationDocumentFaker.fake({
      status: DocumentValidationStatus.ResendRequested,
      checklistLink: { caseId: 'case-1' },
    })
    documentValidationsRepository.recordResendRequest.mockResolvedValue(document)
    documentValidationsRepository.findByFileId.mockResolvedValue(document)
    getDocumentValidation.execute.mockResolvedValue(document)

    const result = await useCase.execute({
      documentFileId: document.id,
      reviewedBy: 'reviewer-id',
      reason: 'Campos obrigatórios ausentes.',
      message: 'Olá, envie novamente com todos os campos obrigatórios.',
      actorId: 'collaborator-1',
    })

    expect(result).toEqual(document)
    expect(caseAccessProvider.authorize).toHaveBeenCalledWith({
      caseId: 'case-1',
      actorId: 'collaborator-1',
      intent: 'write_content',
    })
    expect(documentValidationLogsRepository.add).toHaveBeenCalledWith({
      documentFileId: document.id,
      actorId: 'reviewer-id',
      action: DocumentValidationLogAction.ResendRequested,
      status: DocumentValidationStatus.ResendRequested,
      reason: 'Campos obrigatórios ausentes.',
      message: 'Olá, envie novamente com todos os campos obrigatórios.',
    })
    expect(caseChecklistUpdateProvider.markDocumentResendRequested).toHaveBeenCalledWith({
      documentFileId: document.id,
      caseId: document.checklistLink?.caseId,
      actorId: 'collaborator-1',
    })
    expect(getDocumentValidation.execute).toHaveBeenCalledWith({
      documentFileId: document.id,
      actorId: 'collaborator-1',
    })
  })

  it('fails before writes when the requested file does not exist', async () => {
    documentValidationsRepository.findByFileId.mockResolvedValue(undefined)

    await expect(
      useCase.execute({
        documentFileId: 'missing-file',
        reviewedBy: 'reviewer-id',
        message: 'Envie novamente.',
        actorId: 'collaborator-1',
      }),
    ).rejects.toThrow(DocumentFileNotFoundError)

    expect(documentValidationsRepository.recordResendRequest).not.toHaveBeenCalled()
    expect(documentValidationLogsRepository.add).not.toHaveBeenCalled()
    expect(caseAccessProvider.authorize).not.toHaveBeenCalled()
  })

  it('records a resend for an unlinked document without case authorization', async () => {
    const document = DocumentValidationDocumentFaker.fake({
      id: 'file-without-case',
      checklistLink: undefined,
    })
    documentValidationsRepository.findByFileId.mockResolvedValue(document)
    documentValidationsRepository.recordResendRequest.mockResolvedValue(document)
    getDocumentValidation.execute.mockResolvedValue(document)

    await useCase.execute({
      documentFileId: document.id,
      reviewedBy: 'reviewer-id',
      message: 'Envie novamente.',
      actorId: 'collaborator-1',
    })

    expect(caseAccessProvider.authorize).not.toHaveBeenCalled()
    expect(caseChecklistUpdateProvider.markDocumentResendRequested).toHaveBeenCalledWith({
      documentFileId: document.id,
      caseId: undefined,
      actorId: 'collaborator-1',
    })
  })
})
