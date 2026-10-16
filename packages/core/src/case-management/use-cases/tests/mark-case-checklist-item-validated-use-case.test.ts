import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { LegalCaseFaker } from '../../domain/entities/fakers'
import type {
  CaseAccessProvider,
  CaseChecklistItemsRepository,
  LegalCasesRepository,
} from '../../interfaces'
import { MarkCaseChecklistItemValidatedUseCase } from '../mark-case-checklist-item-validated-use-case'
import { CaseChecklistItemStatus } from '../../domain/structures'

describe('Mark Case Checklist Item Validated Use Case', () => {
  let checklistItemsRepository: MockProxy<CaseChecklistItemsRepository>
  let legalCasesRepository: MockProxy<LegalCasesRepository>
  let accessProvider: MockProxy<CaseAccessProvider>
  let useCase: MarkCaseChecklistItemValidatedUseCase

  beforeEach(() => {
    checklistItemsRepository = mock<CaseChecklistItemsRepository>()
    legalCasesRepository = mock<LegalCasesRepository>()
    accessProvider = mock<CaseAccessProvider>()
    useCase = new MarkCaseChecklistItemValidatedUseCase(
      checklistItemsRepository,
      legalCasesRepository,
      accessProvider,
    )
  })

  it('links a validated document to the checklist item without completing pending mandatory checklist', async () => {
    const checklistItemId = '00000000-0000-4000-8000-000000000301'
    const caseId = '00000000-0000-4000-8000-000000000302'
    const reviewedBy = '00000000-0000-4000-8000-000000000303'
    const documentFileId = '00000000-0000-4000-8000-000000000304'
    const documentFileName = 'procuracao.pdf'

    checklistItemsRepository.markAsValidatedByDocument.mockResolvedValue({
      id: checklistItemId,
      caseId,
      templateItemKey: 'power-of-attorney',
      title: 'Procuração assinada',
      isRequired: true,
      status: CaseChecklistItemStatus.Validated,
      documentFileId,
      validatedAt: new Date('2026-08-28T10:00:00.000Z'),
      validatedBy: reviewedBy,
      createdAt: new Date('2026-08-28T09:00:00.000Z'),
      updatedAt: new Date('2026-08-28T10:00:00.000Z'),
    })
    checklistItemsRepository.hasPendingRequiredItems.mockResolvedValue(true)

    await useCase.execute({
      caseId,
      checklistItemId,
      documentFileId,
      documentFileName,
      actorId: reviewedBy,
      validatedBy: reviewedBy,
    })

    expect(checklistItemsRepository.markAsValidatedByDocument).toHaveBeenCalledWith({
      caseId,
      checklistItemId,
      documentFileId,
      documentFileName,
      validatedBy: reviewedBy,
    })
    expect(legalCasesRepository.completeChecklist).not.toHaveBeenCalled()
  })

  it('completes the case checklist when the last mandatory item is validated', async () => {
    const checklistItemId = '00000000-0000-4000-8000-000000000401'
    const caseId = '00000000-0000-4000-8000-000000000402'
    const reviewedBy = '00000000-0000-4000-8000-000000000403'
    const documentFileId = '00000000-0000-4000-8000-000000000404'
    const documentFileName = 'comprovante.pdf'

    checklistItemsRepository.markAsValidatedByDocument.mockResolvedValue({
      id: checklistItemId,
      caseId,
      templateItemKey: 'proof-of-residence',
      title: 'Comprovante de residência',
      isRequired: true,
      status: CaseChecklistItemStatus.Validated,
      documentFileId,
      validatedAt: new Date('2026-08-28T10:00:00.000Z'),
      validatedBy: reviewedBy,
      createdAt: new Date('2026-08-28T09:00:00.000Z'),
      updatedAt: new Date('2026-08-28T10:00:00.000Z'),
    })
    checklistItemsRepository.hasPendingRequiredItems.mockResolvedValue(false)
    legalCasesRepository.completeChecklist.mockResolvedValue(
      LegalCaseFaker.fake({ id: caseId, checklistCompletedBy: reviewedBy }),
    )

    await useCase.execute({
      caseId,
      checklistItemId,
      documentFileId,
      documentFileName,
      actorId: reviewedBy,
      validatedBy: reviewedBy,
    })

    expect(legalCasesRepository.completeChecklist).toHaveBeenCalledWith(
      caseId,
      reviewedBy,
    )
  })

  it('does not complete the case checklist when only an optional item was validated', async () => {
    const checklistItemId = '00000000-0000-4000-8000-000000000501'
    const caseId = '00000000-0000-4000-8000-000000000502'
    const reviewedBy = '00000000-0000-4000-8000-000000000503'
    const documentFileId = '00000000-0000-4000-8000-000000000504'
    const documentFileName = 'relatorio.pdf'

    checklistItemsRepository.markAsValidatedByDocument.mockResolvedValue({
      id: checklistItemId,
      caseId,
      templateItemKey: 'supporting-medical-report',
      title: 'Relatório médico complementar',
      isRequired: false,
      status: CaseChecklistItemStatus.Validated,
      documentFileId,
      validatedAt: new Date('2026-08-28T10:00:00.000Z'),
      validatedBy: reviewedBy,
      createdAt: new Date('2026-08-28T09:00:00.000Z'),
      updatedAt: new Date('2026-08-28T10:00:00.000Z'),
    })
    checklistItemsRepository.hasPendingRequiredItems.mockResolvedValue(true)

    await useCase.execute({
      caseId,
      checklistItemId,
      documentFileId,
      documentFileName,
      actorId: reviewedBy,
      validatedBy: reviewedBy,
    })

    expect(legalCasesRepository.completeChecklist).not.toHaveBeenCalled()
  })

  it('validates the checklist item found by document file ID', async () => {
    const caseId = '00000000-0000-4000-8000-000000000602'
    const documentFileId = '00000000-0000-4000-8000-000000000604'
    const item = {
      id: '00000000-0000-4000-8000-000000000601',
      caseId,
      templateItemKey: 'proof-of-residence',
      title: 'Comprovante de residência',
      isRequired: true,
      status: CaseChecklistItemStatus.Validated,
      documentFileId,
      documentFileName: 'comprovante.pdf',
      validatedAt: new Date('2026-08-28T10:00:00.000Z'),
      validatedBy: '00000000-0000-4000-8000-000000000603',
      createdAt: new Date('2026-08-28T09:00:00.000Z'),
      updatedAt: new Date('2026-08-28T10:00:00.000Z'),
    }
    checklistItemsRepository.findByDocumentFileId
      .mockResolvedValueOnce(item)
      .mockResolvedValueOnce(item)
    checklistItemsRepository.markAsValidatedByDocument.mockResolvedValue(item)
    checklistItemsRepository.hasPendingRequiredItems.mockResolvedValue(true)

    await expect(
      useCase.executeByDocumentFileId({
        documentFileId,
        documentFileName: 'comprovante.pdf',
        actorId: '00000000-0000-4000-8000-000000000605',
        validatedBy: '00000000-0000-4000-8000-000000000603',
      }),
    ).resolves.toBe(item)

    expect(accessProvider.authorize).toHaveBeenCalledWith({
      caseId,
      actorId: '00000000-0000-4000-8000-000000000605',
      intent: 'write_content',
    })
    expect(checklistItemsRepository.markAsValidatedByDocument).toHaveBeenCalledWith({
      caseId,
      checklistItemId: item.id,
      documentFileId,
      documentFileName: 'comprovante.pdf',
      validatedBy: '00000000-0000-4000-8000-000000000603',
    })
  })

  it('rejects when the document file is not attached to a case checklist item', async () => {
    checklistItemsRepository.findByDocumentFileId.mockResolvedValue(undefined)

    await expect(
      useCase.executeByDocumentFileId({
        documentFileId: '00000000-0000-4000-8000-000000000704',
        documentFileName: 'sem-vinculo.pdf',
        actorId: '00000000-0000-4000-8000-000000000705',
        validatedBy: '00000000-0000-4000-8000-000000000706',
      }),
    ).rejects.toThrow('O caso não foi encontrado.')
    expect(accessProvider.authorize).not.toHaveBeenCalled()
  })

  it('rejects if the document checklist link disappears after access is authorized', async () => {
    checklistItemsRepository.findByDocumentFileId
      .mockResolvedValueOnce({
        id: '00000000-0000-4000-8000-000000000801',
        caseId: '00000000-0000-4000-8000-000000000802',
        templateItemKey: 'proof-of-residence',
        title: 'Comprovante',
        isRequired: true,
        status: 'pending',
        createdAt: new Date('2026-08-28T09:00:00.000Z'),
        updatedAt: new Date('2026-08-28T09:00:00.000Z'),
      })
      .mockResolvedValueOnce(undefined)

    await expect(
      useCase.executeByDocumentFileId({
        documentFileId: '00000000-0000-4000-8000-000000000804',
        documentFileName: 'comprovante.pdf',
        actorId: '00000000-0000-4000-8000-000000000805',
        validatedBy: '00000000-0000-4000-8000-000000000806',
      }),
    ).rejects.toThrow('O caso não foi encontrado.')
    expect(accessProvider.authorize).toHaveBeenCalledOnce()
    expect(checklistItemsRepository.markAsValidatedByDocument).not.toHaveBeenCalled()
  })

  it('rejects when the checklist item could not be validated', async () => {
    checklistItemsRepository.markAsValidatedByDocument.mockResolvedValue(
      undefined as never,
    )

    await expect(
      useCase.execute({
        caseId: '00000000-0000-4000-8000-000000000902',
        checklistItemId: '00000000-0000-4000-8000-000000000901',
        documentFileId: '00000000-0000-4000-8000-000000000904',
        documentFileName: 'comprovante.pdf',
        actorId: '00000000-0000-4000-8000-000000000905',
        validatedBy: '00000000-0000-4000-8000-000000000906',
      }),
    ).rejects.toThrow('O caso não foi encontrado.')
  })
})
