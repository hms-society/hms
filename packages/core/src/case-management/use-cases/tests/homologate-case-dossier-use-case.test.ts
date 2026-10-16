import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { LegalCaseFaker, CaseChecklistItemFaker } from '../../domain/entities/fakers'
import {
  CaseChecklistGateDecision,
  CaseChecklistItemStatus,
  LegalCaseLifecycleStatus,
  LegalCaseStatus,
} from '../../domain/structures'
import type { CaseChecklistItemsRepository, LegalCasesRepository } from '../../interfaces'
import { HomologateCaseDossierUseCase } from '../homologate-case-dossier-use-case'

import { vi } from 'vitest'

describe('Homologate Case Dossier Use Case', () => {
  let cases: MockProxy<LegalCasesRepository>
  let checklistItems: MockProxy<CaseChecklistItemsRepository>
  let useCase: HomologateCaseDossierUseCase

  beforeEach(() => {
    cases = mock<LegalCasesRepository>()
    checklistItems = mock<CaseChecklistItemsRepository>()
    useCase = new HomologateCaseDossierUseCase(cases, checklistItems, {
      authorize: vi.fn().mockResolvedValue(undefined),
    })
  })

  it.each([
    CaseChecklistItemStatus.Validated,
    CaseChecklistItemStatus.Waived,
  ])('homologates a reviewed dossier when required items are fulfilled by %s', async (status) => {
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
      CaseChecklistItemFaker.fake({
        status,
        waiver:
          status === CaseChecklistItemStatus.Waived
            ? {
                justification: 'Unavailable',
                actorId: 'reviewer-1',
                actorName: 'Manager',
                grantedAt: new Date('2026-10-13T12:00:00Z'),
              }
            : undefined,
      }),
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
        remarks: 'Documento dispensado por decisÃ£o do gestor.',
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
    ).rejects.toThrow()
    expect(checklistItems.listByCaseId).not.toHaveBeenCalled()
    expect(cases.homologateDossier).not.toHaveBeenCalled()
  })
  it('rejects missing cases, the wrong status, and an already homologated dossier', async () => {
    cases.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ caseId: 'missing', homologatedBy: 'reviewer-1' }),
    ).rejects.toThrow()

    cases.findById.mockResolvedValue(
      LegalCaseFaker.fake({
        checklistGate: { decision: CaseChecklistGateDecision.Approved },
        workflowStage: LegalCaseStatus.LegalProduction,
      }),
    )
    await expect(
      useCase.execute({ caseId: 'case-1', homologatedBy: 'reviewer-1' }),
    ).rejects.toThrow()

    cases.findById.mockResolvedValue(
      LegalCaseFaker.fake({
        checklistGate: { decision: CaseChecklistGateDecision.Approved },
        workflowStage: LegalCaseStatus.ReadyForLegalProduction,
        dossierGate: { homologatedAt: new Date(), homologatedBy: 'reviewer-1' },
      }),
    )
    await expect(
      useCase.execute({ caseId: 'case-1', homologatedBy: 'reviewer-1' }),
    ).rejects.toThrow()
    expect(checklistItems.listByCaseId).not.toHaveBeenCalled()
    expect(cases.homologateDossier).not.toHaveBeenCalled()
  })

  it('requires at least one validated required item and a successful status update', async () => {
    const legalCase = LegalCaseFaker.fake({
      checklistGate: { decision: CaseChecklistGateDecision.Approved },
      workflowStage: LegalCaseStatus.ReadyForLegalProduction,
    })
    cases.findById.mockResolvedValue(legalCase)
    checklistItems.listByCaseId.mockResolvedValue([
      { isRequired: false, status: CaseChecklistItemStatus.Pending } as never,
    ])

    await expect(
      useCase.execute({ caseId: legalCase.id, homologatedBy: 'reviewer-1' }),
    ).rejects.toThrow(
      'O dossiê não pode ser homologado enquanto houver documentos obrigatórios pendentes de atendimento por validação ou dispensa.',
    )

    checklistItems.listByCaseId.mockResolvedValue([
      { isRequired: true, status: CaseChecklistItemStatus.Validated } as never,
    ])
    cases.homologateDossier.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ caseId: legalCase.id, homologatedBy: 'reviewer-1' }),
    ).rejects.toThrow()
  })

  it('rejects dossier homologation for a closed case at the ready workflow stage', async () => {
    const legalCase = LegalCaseFaker.fake({
      checklistGate: { decision: CaseChecklistGateDecision.Approved },
      workflowStage: LegalCaseStatus.ReadyForLegalProduction,
      lifecycleStatus: LegalCaseLifecycleStatus.Closed,
    })
    cases.findById.mockResolvedValue(legalCase)

    await expect(
      useCase.execute({ caseId: legalCase.id, homologatedBy: 'reviewer-1' }),
    ).rejects.toThrow()
    expect(checklistItems.listByCaseId).not.toHaveBeenCalled()
    expect(cases.homologateDossier).not.toHaveBeenCalled()
  })
})
