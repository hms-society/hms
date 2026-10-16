import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { LegalCaseFaker } from '../../domain/entities/fakers'
import {
  CaseChecklistGateDecision,
  CaseChecklistItemStatus,
  LegalCaseLifecycleStatus,
  LegalCaseStatus,
} from '../../domain/structures'
import type { CaseChecklistItemsRepository, LegalCasesRepository } from '../../interfaces'
import { HomologateCaseDossierUseCase } from '../homologate-case-dossier-use-case'

describe('Homologate Case Dossier Use Case', () => {
  let cases: MockProxy<LegalCasesRepository>
  let checklistItems: MockProxy<CaseChecklistItemsRepository>
  let useCase: HomologateCaseDossierUseCase

  beforeEach(() => {
    cases = mock<LegalCasesRepository>()
    checklistItems = mock<CaseChecklistItemsRepository>()
    useCase = new HomologateCaseDossierUseCase(cases, checklistItems)
  })

  it('homologates a reviewed dossier when all required items are validated', async () => {
    const legalCase = LegalCaseFaker.fake({
      checklistGate: { decision: CaseChecklistGateDecision.Approved },
      workflowStage: LegalCaseStatus.ReadyForLegalProduction,
    })
    const homologatedCase = LegalCaseFaker.fake({
      ...legalCase,
      dossierGate: { homologatedAt: new Date(), homologatedBy: 'reviewer-1' },
      workflowStage: LegalCaseStatus.LegalProduction,
    })
    cases.findById.mockResolvedValue(legalCase)
    cases.listByTeamMember.mockResolvedValue([{ id: legalCase.id } as never])
    checklistItems.listByCaseId.mockResolvedValue([
      { isRequired: true, status: CaseChecklistItemStatus.Validated } as never,
    ])
    cases.homologateDossier.mockResolvedValue(homologatedCase)

    await expect(
      useCase.execute({ caseId: legalCase.id, homologatedBy: 'reviewer-1' }),
    ).resolves.toBe(homologatedCase)
    expect(cases.homologateDossier).toHaveBeenCalledWith({
      caseId: legalCase.id,
      homologatedBy: 'reviewer-1',
      expectedStatus: LegalCaseStatus.ReadyForLegalProduction,
      status: LegalCaseStatus.LegalProduction,
    })
  })

  it('homologates with an approved exception while an authorized required item is pending', async () => {
    const legalCase = LegalCaseFaker.fake({
      checklistGate: {
        decision: CaseChecklistGateDecision.ApprovedWithException,
        remarks: 'Documento dispensado por decisão do gestor.',
      },
      workflowStage: LegalCaseStatus.ReadyForLegalProduction,
    })
    const homologatedCase = LegalCaseFaker.fake({
      ...legalCase,
      dossierGate: { homologatedAt: new Date(), homologatedBy: 'reviewer-1' },
      workflowStage: LegalCaseStatus.LegalProduction,
    })
    cases.findById.mockResolvedValue(legalCase)
    cases.listByTeamMember.mockResolvedValue([{ id: legalCase.id } as never])
    checklistItems.listByCaseId.mockResolvedValue([
      { isRequired: true, status: CaseChecklistItemStatus.Pending } as never,
    ])
    cases.homologateDossier.mockResolvedValue(homologatedCase)

    await expect(
      useCase.execute({ caseId: legalCase.id, homologatedBy: 'reviewer-1' }),
    ).resolves.toBe(homologatedCase)
    expect(cases.homologateDossier).toHaveBeenCalled()
  })

  it('requires a successful checklist decision before dossier homologation', async () => {
    const legalCase = LegalCaseFaker.fake({
      workflowStage: LegalCaseStatus.ReadyForLegalProduction,
    })
    cases.findById.mockResolvedValue(legalCase)
    cases.listByTeamMember.mockResolvedValue([{ id: legalCase.id } as never])

    await expect(
      useCase.execute({ caseId: legalCase.id, homologatedBy: 'reviewer-1' }),
    ).rejects.toThrow('checklist')
    expect(checklistItems.listByCaseId).not.toHaveBeenCalled()
    expect(cases.homologateDossier).not.toHaveBeenCalled()
  })

  it('rejects dossier homologation for a closed case with a homologation-ready workflow stage', async () => {
    const legalCase = LegalCaseFaker.fake({
      checklistGate: { decision: CaseChecklistGateDecision.Approved },
      workflowStage: LegalCaseStatus.ReadyForLegalProduction,
      lifecycleStatus: LegalCaseLifecycleStatus.Closed,
    })
    cases.findById.mockResolvedValue(legalCase)
    cases.listByTeamMember.mockResolvedValue([{ id: legalCase.id } as never])

    await expect(
      useCase.execute({ caseId: legalCase.id, homologatedBy: 'reviewer-1' }),
    ).rejects.toThrow('só pode ser homologado')
    expect(cases.homologateDossier).not.toHaveBeenCalled()
  })
})
