import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { LegalCaseSummary } from '../../domain/entities'
import { LegalCaseFaker } from '../../domain/entities/fakers'
import { CaseChecklistGateDecision, LegalCaseStatus } from '../../domain/structures'
import type { LegalCasesRepository } from '../../interfaces'
import { ReviewCaseChecklistGateUseCase } from '../review-case-checklist-gate-use-case'

describe('Review Case Checklist Gate Use Case', () => {
  let repository: MockProxy<LegalCasesRepository>
  let useCase: ReviewCaseChecklistGateUseCase

  beforeEach(() => {
    repository = mock<LegalCasesRepository>()
    useCase = new ReviewCaseChecklistGateUseCase(repository)
  })

  it('approves a complete checklist as the first gate without releasing legal writing', async () => {
    const decidedBy = '00000000-0000-4000-8000-000000000101'
    const legalCase = LegalCaseFaker.fake()
    const reviewedCase = LegalCaseFaker.fake({
      id: legalCase.id,
      checklistGate: {
        decision: CaseChecklistGateDecision.Approved,
        decidedAt: new Date('2026-08-24T12:00:00.000Z'),
        decidedBy,
        remarks: undefined,
      },
      dossierGate: {
        homologatedAt: undefined,
        homologatedBy: undefined,
      },
    })

    repository.findById.mockResolvedValue(legalCase)
    repository.listByTeamMember.mockResolvedValue([
      fakeLegalCaseSummary({ id: legalCase.id }),
    ])
    repository.reviewChecklistGate.mockResolvedValue(reviewedCase)

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        decision: CaseChecklistGateDecision.Approved,
        decidedBy,
      }),
    ).resolves.toBe(reviewedCase)

    expect(repository.reviewChecklistGate).toHaveBeenCalledWith({
      caseId: legalCase.id,
      checklistGate: {
        decision: CaseChecklistGateDecision.Approved,
        decidedBy,
        remarks: undefined,
      },
      status: LegalCaseStatus.ReadyForLegalProduction,
    })
  })

  it('records approval with exception only when remarks explain the exception', async () => {
    const decidedBy = '00000000-0000-4000-8000-000000000102'
    const remarks = 'CNIS será complementado por ofício já autorizado.'
    const legalCase = LegalCaseFaker.fake()
    const reviewedCase = LegalCaseFaker.fake({
      id: legalCase.id,
      checklistGate: {
        decision: CaseChecklistGateDecision.ApprovedWithException,
        decidedAt: new Date('2026-08-24T12:00:00.000Z'),
        decidedBy,
        remarks,
      },
    })

    repository.findById.mockResolvedValue(legalCase)
    repository.listByTeamMember.mockResolvedValue([
      fakeLegalCaseSummary({ id: legalCase.id }),
    ])
    repository.reviewChecklistGate.mockResolvedValue(reviewedCase)

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        decision: CaseChecklistGateDecision.ApprovedWithException,
        decidedBy,
        remarks,
      }),
    ).resolves.toBe(reviewedCase)

    expect(repository.reviewChecklistGate).toHaveBeenCalledWith({
      caseId: legalCase.id,
      checklistGate: {
        decision: CaseChecklistGateDecision.ApprovedWithException,
        decidedBy,
        remarks,
      },
      status: LegalCaseStatus.ReadyForLegalProduction,
    })

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        decision: CaseChecklistGateDecision.ApprovedWithException,
        decidedBy,
        remarks: ' ',
      }),
    ).rejects.toThrow('ressalvas')
  })

  it('blocks production when the checklist is insufficient or legally rejected', async () => {
    const decidedBy = '00000000-0000-4000-8000-000000000103'
    const remarks = 'Documento crítico ilegível.'
    const legalCase = LegalCaseFaker.fake()
    const reviewedCase = LegalCaseFaker.fake({
      id: legalCase.id,
      checklistGate: {
        decision: CaseChecklistGateDecision.BlockedInsufficient,
        decidedAt: new Date('2026-08-24T12:00:00.000Z'),
        decidedBy,
        remarks,
      },
    })

    repository.findById.mockResolvedValue(legalCase)
    repository.listByTeamMember.mockResolvedValue([
      fakeLegalCaseSummary({ id: legalCase.id }),
    ])
    repository.reviewChecklistGate.mockResolvedValue(reviewedCase)

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        decision: CaseChecklistGateDecision.BlockedInsufficient,
        decidedBy,
        remarks,
      }),
    ).resolves.toBe(reviewedCase)

    expect(repository.reviewChecklistGate).toHaveBeenCalledWith({
      caseId: legalCase.id,
      checklistGate: {
        decision: CaseChecklistGateDecision.BlockedInsufficient,
        decidedBy,
        remarks,
      },
      status: LegalCaseStatus.Documentation,
    })
  })

  it('rejects a checklist review for cases outside the collaborator team', async () => {
    const legalCase = LegalCaseFaker.fake()

    repository.findById.mockResolvedValue(legalCase)
    repository.listByTeamMember.mockResolvedValue([])

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        decision: CaseChecklistGateDecision.Approved,
        decidedBy: '00000000-0000-4000-8000-000000000104',
      }),
    ).rejects.toThrow('O caso não foi encontrado.')

    expect(repository.reviewChecklistGate).not.toHaveBeenCalled()
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
