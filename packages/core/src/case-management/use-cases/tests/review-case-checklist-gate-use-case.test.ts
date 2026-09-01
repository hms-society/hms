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
    const legalCase = LegalCaseFaker.fake({
      checklistCompletedAt: new Date('2026-08-24T11:00:00.000Z'),
      checklistCompletedBy: decidedBy,
    })
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
      expectedStatus: LegalCaseStatus.Documentation,
      status: LegalCaseStatus.ReadyForLegalProduction,
    })
  })

  it('rejects approval when the persisted checklist is incomplete', async () => {
    const legalCase = LegalCaseFaker.fake()

    repository.findById.mockResolvedValue(legalCase)
    repository.listByTeamMember.mockResolvedValue([
      fakeLegalCaseSummary({ id: legalCase.id }),
    ])

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        decision: CaseChecklistGateDecision.Approved,
        decidedBy: '00000000-0000-4000-8000-000000000110',
      }),
    ).rejects.toThrow('itens obrigatórios')

    expect(repository.reviewChecklistGate).not.toHaveBeenCalled()
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
      expectedStatus: LegalCaseStatus.Documentation,
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
      expectedStatus: LegalCaseStatus.Documentation,
      status: LegalCaseStatus.Documentation,
    })
  })

  it('requires remarks when the checklist is blocked or rejected on merit', async () => {
    const decidedBy = '00000000-0000-4000-8000-000000000105'
    const legalCase = LegalCaseFaker.fake()

    repository.findById.mockResolvedValue(legalCase)
    repository.listByTeamMember.mockResolvedValue([
      fakeLegalCaseSummary({ id: legalCase.id }),
    ])

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        decision: CaseChecklistGateDecision.BlockedInsufficient,
        decidedBy,
        remarks: ' ',
      }),
    ).rejects.toThrow('bloquear')

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        decision: CaseChecklistGateDecision.RejectedOnMerit,
        decidedBy,
      }),
    ).rejects.toThrow('reprovar')

    expect(repository.reviewChecklistGate).not.toHaveBeenCalled()
  })

  it('rejects checklist review outside the documentation stage', async () => {
    const legalCase = LegalCaseFaker.fake({
      status: LegalCaseStatus.LegalProduction,
    })

    repository.findById.mockResolvedValue(legalCase)
    repository.listByTeamMember.mockResolvedValue([
      fakeLegalCaseSummary({ id: legalCase.id }),
    ])

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        decision: CaseChecklistGateDecision.Approved,
        decidedBy: '00000000-0000-4000-8000-000000000106',
      }),
    ).rejects.toThrow('documentação')

    expect(repository.reviewChecklistGate).not.toHaveBeenCalled()
  })

  it('rejects checklist review when the gate was already decided', async () => {
    const legalCase = LegalCaseFaker.fake({
      checklistGate: {
        decision: CaseChecklistGateDecision.Approved,
        decidedAt: new Date('2026-08-24T12:00:00.000Z'),
        decidedBy: '00000000-0000-4000-8000-000000000107',
        remarks: undefined,
      },
    })

    repository.findById.mockResolvedValue(legalCase)
    repository.listByTeamMember.mockResolvedValue([
      fakeLegalCaseSummary({ id: legalCase.id }),
    ])

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        decision: CaseChecklistGateDecision.Approved,
        decidedBy: '00000000-0000-4000-8000-000000000108',
      }),
    ).rejects.toThrow('já foi revisado')

    expect(repository.reviewChecklistGate).not.toHaveBeenCalled()
  })

  it('rejects checklist review when the conditional update loses the race', async () => {
    const legalCase = LegalCaseFaker.fake({
      checklistCompletedAt: new Date('2026-08-24T11:00:00.000Z'),
      checklistCompletedBy: '00000000-0000-4000-8000-000000000109',
    })

    repository.findById.mockResolvedValue(legalCase)
    repository.listByTeamMember.mockResolvedValue([
      fakeLegalCaseSummary({ id: legalCase.id }),
    ])
    repository.reviewChecklistGate.mockResolvedValue(undefined)

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        decision: CaseChecklistGateDecision.Approved,
        decidedBy: '00000000-0000-4000-8000-000000000109',
      }),
    ).rejects.toThrow('não pode mais ser revisado')
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
