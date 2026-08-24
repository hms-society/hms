import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentValidationDocumentFaker } from '../../domain/entities/fakers'
import {
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
    const document = DocumentValidationDocumentFaker.fake({
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
