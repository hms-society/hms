import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { CaseChecklistItem } from '../../domain/entities'
import { CaseChecklistItemStatus } from '../../domain/structures'
import type {
  CaseChecklistItemsRepository,
  CasePortalAccessGrantsRepository,
  LegalCasesRepository,
} from '../../interfaces'
import { LegalCaseFaker } from '../../domain/entities/fakers/legal-case-faker'
import { ListCasePortalPendingChecklistUseCase } from '../list-case-portal-pending-checklist-use-case'

describe('List Case Portal Pending Checklist Use Case', () => {
  let legalCasesRepository: MockProxy<LegalCasesRepository>
  let checklistItemsRepository: MockProxy<CaseChecklistItemsRepository>
  let grantsRepository: MockProxy<CasePortalAccessGrantsRepository>
  let useCase: ListCasePortalPendingChecklistUseCase

  beforeEach(() => {
    legalCasesRepository = mock<LegalCasesRepository>()
    checklistItemsRepository = mock<CaseChecklistItemsRepository>()
    grantsRepository = mock<CasePortalAccessGrantsRepository>()
    useCase = new ListCasePortalPendingChecklistUseCase(
      legalCasesRepository,
      checklistItemsRepository,
      grantsRepository,
    )
  })

  it('returns active and validated checklist items for an authorized case', async () => {
    const legalCase = LegalCaseFaker.fake()
    const tokenHash = faker.string.hexadecimal({ length: 64 })
    const pendingItem = checklistItem(legalCase.id, CaseChecklistItemStatus.Pending)
    const validatedItem = checklistItem(legalCase.id, CaseChecklistItemStatus.Validated)
    legalCasesRepository.findById.mockResolvedValue(legalCase)
    grantsRepository.findActiveByTokenHashAndCase.mockResolvedValue({
      id: faker.string.uuid(),
      caseId: legalCase.id,
      tokenHash,
      canView: true,
      canUpload: true,
      status: 'active',
      grantedBy: faker.string.uuid(),
      createdAt: new Date(),
    })
    checklistItemsRepository.listByCaseId.mockResolvedValue([
      pendingItem,
      validatedItem,
    ])

    await expect(useCase.execute({ caseId: legalCase.id, tokenHash })).resolves.toEqual([
      pendingItem,
      validatedItem,
    ])
  })

  it('denies users without an active case grant', async () => {
    const legalCase = LegalCaseFaker.fake()
    legalCasesRepository.findById.mockResolvedValue(legalCase)
    grantsRepository.findActiveByTokenHashAndCase.mockResolvedValue(undefined)

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        tokenHash: faker.string.hexadecimal({ length: 64 }),
      }),
    ).rejects.toThrow('não possui acesso')
    expect(checklistItemsRepository.listByCaseId).not.toHaveBeenCalled()
  })
})

function checklistItem(caseId: string, status: CaseChecklistItem['status']): CaseChecklistItem {
  const now = new Date()
  return {
    id: faker.string.uuid(),
    caseId,
    templateItemKey: faker.string.uuid(),
    title: faker.lorem.words(3),
    isRequired: true,
    status,
    createdAt: now,
    updatedAt: now,
  }
}
