import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { LegalCaseSummary } from '../../domain/entities'
import { LegalCaseFaker } from '../../domain/entities/fakers'
import { CaseChecklistGateDecision, LegalCaseStatus } from '../../domain/structures'
import type { LegalCasesRepository } from '../../interfaces'
import { CompleteCaseChecklistUseCase } from '../complete-case-checklist-use-case'

describe('Complete Case Checklist Use Case', () => {
  let repository: MockProxy<LegalCasesRepository>
  let useCase: CompleteCaseChecklistUseCase

  beforeEach(() => {
    repository = mock<LegalCasesRepository>()
    useCase = new CompleteCaseChecklistUseCase(repository)
  })

  it('completes a checklist for a case team member', async () => {
    const completedBy = '00000000-0000-4000-8000-000000000301'
    const legalCase = LegalCaseFaker.fake()
    const completedCase = LegalCaseFaker.fake({
      id: legalCase.id,
      checklistCompletedAt: new Date('2026-08-27T12:00:00.000Z'),
      checklistCompletedBy: completedBy,
    })

    repository.findById.mockResolvedValue(legalCase)
    repository.listByTeamMember.mockResolvedValue([
      fakeLegalCaseSummary({ id: legalCase.id }),
    ])
    repository.completeChecklist.mockResolvedValue(completedCase)

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        completedBy,
      }),
    ).resolves.toBe(completedCase)

    expect(repository.completeChecklist).toHaveBeenCalledWith(legalCase.id, completedBy)
  })

  it('rejects completion outside the documentation stage or after review', async () => {
    const reviewedCase = LegalCaseFaker.fake({
      checklistGate: {
        decision: CaseChecklistGateDecision.Approved,
        decidedAt: new Date('2026-08-27T12:00:00.000Z'),
        decidedBy: '00000000-0000-4000-8000-000000000302',
        remarks: undefined,
      },
    })
    repository.findById.mockResolvedValue(reviewedCase)
    repository.listByTeamMember.mockResolvedValue([
      fakeLegalCaseSummary({ id: reviewedCase.id }),
    ])

    await expect(
      useCase.execute({
        caseId: reviewedCase.id,
        completedBy: '00000000-0000-4000-8000-000000000303',
      }),
    ).rejects.toThrow('já foi revisado')

    repository.findById.mockResolvedValue(
      LegalCaseFaker.fake({
        id: reviewedCase.id,
        status: LegalCaseStatus.LegalProduction,
      }),
    )

    await expect(
      useCase.execute({
        caseId: reviewedCase.id,
        completedBy: '00000000-0000-4000-8000-000000000304',
      }),
    ).rejects.toThrow('documentação')

    expect(repository.completeChecklist).not.toHaveBeenCalled()
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
