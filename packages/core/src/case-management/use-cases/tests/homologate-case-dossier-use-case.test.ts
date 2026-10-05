import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { LegalCaseFaker } from '../../domain/entities/fakers'
import {
  CaseChecklistGateDecision,
  CaseChecklistItemStatus,
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
      status: LegalCaseStatus.ReadyForLegalProduction,
    })
    const homologatedCase = LegalCaseFaker.fake({
      ...legalCase,
      dossierGate: { homologatedAt: new Date(), homologatedBy: 'reviewer-1' },
      status: LegalCaseStatus.LegalProduction,
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

  it('does not homologate while a required checklist item is pending', async () => {
    const legalCase = LegalCaseFaker.fake({
      checklistGate: { decision: CaseChecklistGateDecision.ApprovedWithException },
      status: LegalCaseStatus.ReadyForLegalProduction,
    })
    cases.findById.mockResolvedValue(legalCase)
    cases.listByTeamMember.mockResolvedValue([{ id: legalCase.id } as never])
    checklistItems.listByCaseId.mockResolvedValue([
      { isRequired: true, status: CaseChecklistItemStatus.Pending } as never,
    ])

    await expect(
      useCase.execute({ caseId: legalCase.id, homologatedBy: 'reviewer-1' }),
    ).rejects.toThrow('documentos obrigatórios')
    expect(cases.homologateDossier).not.toHaveBeenCalled()
  })

  it('requires a successful checklist decision before dossier homologation', async () => {
    const legalCase = LegalCaseFaker.fake({
      status: LegalCaseStatus.ReadyForLegalProduction,
    })
    cases.findById.mockResolvedValue(legalCase)
    cases.listByTeamMember.mockResolvedValue([{ id: legalCase.id } as never])

    await expect(
      useCase.execute({ caseId: legalCase.id, homologatedBy: 'reviewer-1' }),
    ).rejects.toThrow('checklist')
    expect(checklistItems.listByCaseId).not.toHaveBeenCalled()
    expect(cases.homologateDossier).not.toHaveBeenCalled()
  })
})
