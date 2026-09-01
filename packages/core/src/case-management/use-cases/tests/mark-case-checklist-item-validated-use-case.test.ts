import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { LegalCaseFaker } from '../../domain/entities/fakers'
import type { CaseChecklistItemsRepository, LegalCasesRepository } from '../../interfaces'
import { MarkCaseChecklistItemValidatedUseCase } from '../mark-case-checklist-item-validated-use-case'

describe('Mark Case Checklist Item Validated Use Case', () => {
  let checklistItemsRepository: MockProxy<CaseChecklistItemsRepository>
  let legalCasesRepository: MockProxy<LegalCasesRepository>
  let useCase: MarkCaseChecklistItemValidatedUseCase

  beforeEach(() => {
    checklistItemsRepository = mock<CaseChecklistItemsRepository>()
    legalCasesRepository = mock<LegalCasesRepository>()
    useCase = new MarkCaseChecklistItemValidatedUseCase(
      checklistItemsRepository,
      legalCasesRepository,
    )
  })

  it('links a validated document to the checklist item without completing pending mandatory checklist', async () => {
    const checklistItemId = '00000000-0000-4000-8000-000000000301'
    const caseId = '00000000-0000-4000-8000-000000000302'
    const reviewedBy = '00000000-0000-4000-8000-000000000303'
    const documentFileId = '00000000-0000-4000-8000-000000000304'

    checklistItemsRepository.markAsValidatedByDocument.mockResolvedValue({
      id: checklistItemId,
      caseId,
      templateItemKey: 'power-of-attorney',
      title: 'Procuração assinada',
      isRequired: true,
      status: 'validated',
      documentFileId,
      validatedAt: new Date('2026-08-28T10:00:00.000Z'),
      validatedBy: reviewedBy,
      createdAt: new Date('2026-08-28T09:00:00.000Z'),
      updatedAt: new Date('2026-08-28T10:00:00.000Z'),
    })
    checklistItemsRepository.hasPendingRequiredItems.mockResolvedValue(true)

    await useCase.execute({ checklistItemId, documentFileId, validatedBy: reviewedBy })

    expect(checklistItemsRepository.markAsValidatedByDocument).toHaveBeenCalledWith({
      checklistItemId,
      documentFileId,
      validatedBy: reviewedBy,
    })
    expect(legalCasesRepository.completeChecklist).not.toHaveBeenCalled()
  })

  it('completes the case checklist when the last mandatory item is validated', async () => {
    const checklistItemId = '00000000-0000-4000-8000-000000000401'
    const caseId = '00000000-0000-4000-8000-000000000402'
    const reviewedBy = '00000000-0000-4000-8000-000000000403'
    const documentFileId = '00000000-0000-4000-8000-000000000404'

    checklistItemsRepository.markAsValidatedByDocument.mockResolvedValue({
      id: checklistItemId,
      caseId,
      templateItemKey: 'proof-of-residence',
      title: 'Comprovante de residência',
      isRequired: true,
      status: 'validated',
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

    await useCase.execute({ checklistItemId, documentFileId, validatedBy: reviewedBy })

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

    checklistItemsRepository.markAsValidatedByDocument.mockResolvedValue({
      id: checklistItemId,
      caseId,
      templateItemKey: 'supporting-medical-report',
      title: 'Relatório médico complementar',
      isRequired: false,
      status: 'validated',
      documentFileId,
      validatedAt: new Date('2026-08-28T10:00:00.000Z'),
      validatedBy: reviewedBy,
      createdAt: new Date('2026-08-28T09:00:00.000Z'),
      updatedAt: new Date('2026-08-28T10:00:00.000Z'),
    })
    checklistItemsRepository.hasPendingRequiredItems.mockResolvedValue(true)

    await useCase.execute({ checklistItemId, documentFileId, validatedBy: reviewedBy })

    expect(legalCasesRepository.completeChecklist).not.toHaveBeenCalled()
  })
})
