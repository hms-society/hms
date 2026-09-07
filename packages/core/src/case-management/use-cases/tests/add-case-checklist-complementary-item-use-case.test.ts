import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { LegalCaseSummary } from '../../domain/entities'
import { LegalCaseFaker } from '../../domain/entities/fakers'
import type { CaseChecklistItemsRepository, LegalCasesRepository } from '../../interfaces'
import { AddCaseChecklistComplementaryItemUseCase } from '../add-case-checklist-complementary-item-use-case'

describe('Add Case Checklist Complementary Item Use Case', () => {
  let checklistItemsRepository: MockProxy<CaseChecklistItemsRepository>
  let legalCasesRepository: MockProxy<LegalCasesRepository>
  let useCase: AddCaseChecklistComplementaryItemUseCase

  beforeEach(() => {
    checklistItemsRepository = mock<CaseChecklistItemsRepository>()
    legalCasesRepository = mock<LegalCasesRepository>()
    useCase = new AddCaseChecklistComplementaryItemUseCase(
      legalCasesRepository,
      checklistItemsRepository,
    )
  })

  it('adds an optional complementary item to an assigned case', async () => {
    const caseId = '00000000-0000-4000-8000-000000000501'
    const collaboratorId = '00000000-0000-4000-8000-000000000502'
    legalCasesRepository.listByTeamMember.mockResolvedValue([
      fakeLegalCaseSummary({ id: caseId }),
    ])
    checklistItemsRepository.addMany.mockResolvedValue([
      {
        id: '00000000-0000-4000-8000-000000000503',
        caseId,
        templateItemKey: 'complementary-proof',
        title: 'Prova complementar',
        isRequired: false,
        status: 'pending',
        createdAt: new Date('2026-08-28T09:00:00.000Z'),
        updatedAt: new Date('2026-08-28T09:00:00.000Z'),
      },
    ])

    const result = await useCase.execute({
      caseId,
      collaboratorId,
      templateItemKey: 'complementary-proof',
      title: 'Prova complementar',
    })

    expect(result.title).toBe('Prova complementar')
    expect(checklistItemsRepository.addMany).toHaveBeenCalledWith([
      {
        caseId,
        templateItemKey: 'complementary-proof',
        title: 'Prova complementar',
        isRequired: false,
      },
    ])
  })
})

function fakeLegalCaseSummary(
  overrides: Partial<LegalCaseSummary> = {},
): LegalCaseSummary {
  const legalCase = LegalCaseFaker.fake(overrides)

  return {
    id: legalCase.id,
    publicCode: legalCase.publicCode,
    title: legalCase.title,
    status: legalCase.status,
    clientName: 'Cliente HMS',
    legalArea: 'Cível',
    legalTopic: 'Contratos',
    openedAt: legalCase.openedAt,
    updatedAt: legalCase.updatedAt,
    checklistGate: legalCase.checklistGate,
    dossierGate: legalCase.dossierGate,
    team: [],
    ...overrides,
  }
}
