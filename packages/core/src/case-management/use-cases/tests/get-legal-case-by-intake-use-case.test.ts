import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { CaseMember, LegalCase } from '../../domain/entities'
import type { CaseMembersRepository, LegalCasesRepository } from '../../interfaces'
import { GetLegalCaseByIntakeUseCase } from '../get-legal-case-by-intake-use-case'

describe('Get Legal Case By Intake Use Case', () => {
  it('returns the public Case summary with its primary lawyer', async () => {
    const legalCase: LegalCase = {
      id: 'case-1',
      publicCode: 'CASE-0001',
      clientId: 'client-1',
      intakeId: 'intake-1',
      legalAreaId: 'area-1',
      legalTopicId: 'topic-1',
      title: 'Case',
      status: 'documentation',
      openedAt: new Date('2026-09-01T10:00:00.000Z'),
      checklistGate: {},
      dossierGate: {},
      createdAt: new Date('2026-09-01T10:00:00.000Z'),
      updatedAt: new Date('2026-09-01T10:00:00.000Z'),
    }
    const member: CaseMember = {
      id: 'member-1',
      caseId: legalCase.id,
      collaboratorId: 'lawyer-1',
      role: 'lawyer',
      permission: 'visualização',
      isPrimary: true,
      assignedAt: legalCase.openedAt,
      assignedBy: 'admin',
      createdAt: legalCase.openedAt,
    }
    const cases = mock<LegalCasesRepository>()
    const members = mock<CaseMembersRepository>()
    cases.findByIntakeId.mockResolvedValue(legalCase)
    members.findPrimaryByCaseId.mockResolvedValue(member)

    await expect(
      new GetLegalCaseByIntakeUseCase(cases, members).execute({
        intakeId: legalCase.intakeId,
      }),
    ).resolves.toEqual({
      caseId: legalCase.id,
      intakeId: legalCase.intakeId,
      publicCode: legalCase.publicCode,
      status: legalCase.status,
      legalAreaId: legalCase.legalAreaId,
      primaryLawyerId: member.collaboratorId,
      openedAt: legalCase.openedAt,
    })
  })

  it('returns null when no Case exists and never reads members', async () => {
    const cases = mock<LegalCasesRepository>()
    const members = mock<CaseMembersRepository>()
    cases.findByIntakeId.mockResolvedValue(undefined)
    await expect(
      new GetLegalCaseByIntakeUseCase(cases, members).execute({ intakeId: 'intake-1' }),
    ).resolves.toBeNull()
    expect(members.findPrimaryByCaseId).not.toHaveBeenCalled()
  })
})
