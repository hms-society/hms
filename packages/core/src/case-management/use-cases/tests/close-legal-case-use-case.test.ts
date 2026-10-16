import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import { LegalCaseFaker } from '../../domain/entities/fakers'
import type { CaseClosureSnapshot } from '../../domain/structures/case-closure-snapshot'
import { CaseMemberRole, LegalCaseLifecycleStatus } from '../../domain/structures'
import type { CaseClosureAccessProvider, CaseClosureRepository } from '../../interfaces'
import { CloseLegalCaseUseCase } from '../close-legal-case-use-case'

const CASE_ID = 'case-1'
const ACTOR_ID = 'manager-1'
const TEST_AT = new Date('2026-10-15T12:00:00.000Z')

describe('Close Legal Case Use Case', () => {
  let closureRepository: MockProxy<CaseClosureRepository>
  let accessProvider: MockProxy<CaseClosureAccessProvider>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: CloseLegalCaseUseCase
  let snapshot: CaseClosureSnapshot

  beforeEach(() => {
    closureRepository = mock<CaseClosureRepository>()
    accessProvider = mock<CaseClosureAccessProvider>()
    datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(TEST_AT)
    snapshot = {
      legalCase: LegalCaseFaker.fake({
        id: CASE_ID,
        lifecycleStatus: LegalCaseLifecycleStatus.Active,
      }),
      blockers: [],
      events: [],
    }
    closureRepository.getSnapshot.mockResolvedValue(snapshot)
    accessProvider.getActorAccess.mockResolvedValue({
      isAuthenticated: true,
      isActive: true,
      isEligible: true,
      role: CaseMemberRole.Manager,
    })
    useCase = new CloseLegalCaseUseCase(
      closureRepository,
      accessProvider,
      datetimeProvider,
    )
  })

  it('persists a valid outcome through the atomic repository contract', async () => {
    const closedCase = LegalCaseFaker.fake({
      ...snapshot.legalCase,
      lifecycleStatus: LegalCaseLifecycleStatus.Closed,
    })
    const closure = {
      outcome: 'agreement' as const,
      notes: 'Acordo homologado.',
      closedBy: ACTOR_ID,
      closedAt: TEST_AT,
    }
    const event = {
      id: 'event-1',
      caseId: CASE_ID,
      type: 'closed' as const,
      actorId: ACTOR_ID,
      occurredAt: TEST_AT,
      outcome: 'agreement' as const,
      notes: 'Acordo homologado.',
    }
    closureRepository.close.mockResolvedValue({
      kind: 'closed',
      legalCase: closedCase,
      closure,
      event,
    })

    await expect(
      useCase.execute({
        caseId: CASE_ID,
        actorId: ACTOR_ID,
        outcome: 'agreement',
        notes: ' Acordo homologado. ',
      }),
    ).resolves.toMatchObject({ kind: 'closed', legalCase: closedCase, closure, event })
    expect(closureRepository.close).toHaveBeenCalledWith({
      caseId: CASE_ID,
      outcome: 'agreement',
      notes: 'Acordo homologado.',
      actorId: ACTOR_ID,
      occurredAt: TEST_AT,
    })
  })

  it('returns every current blocker without claiming the case closed', async () => {
    const blockers = [
      {
        id: 'deadline-1',
        kind: 'legal_deadline' as const,
        title: 'Prazo processual',
        section: 'deadlines' as const,
        href: '/cases/case-1/deadlines',
      },
      {
        id: 'task-1',
        kind: 'blocking_task' as const,
        title: 'Revisar peça',
        section: 'tasks' as const,
        href: '/cases/case-1/tasks',
      },
    ]
    closureRepository.close.mockResolvedValue({ kind: 'blocked', blockers })

    await expect(
      useCase.execute({
        caseId: CASE_ID,
        actorId: ACTOR_ID,
        outcome: 'favorable',
      }),
    ).resolves.toEqual({ kind: 'blocked', blockers })
    expect(closureRepository.close).toHaveBeenCalledOnce()
  })

  it('denies non-manager, inactive, or ineligible actors before mutation', async () => {
    accessProvider.getActorAccess.mockResolvedValue({
      isAuthenticated: true,
      isActive: true,
      isEligible: false,
      role: CaseMemberRole.Manager,
    })

    await expect(
      useCase.execute({ caseId: CASE_ID, actorId: ACTOR_ID, outcome: 'other' }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(closureRepository.close).not.toHaveBeenCalled()
  })

  it('rejects closed or uninitialized lifecycle state before mutation', async () => {
    closureRepository.getSnapshot.mockResolvedValue({
      ...snapshot,
      legalCase: LegalCaseFaker.fake({
        id: CASE_ID,
        lifecycleStatus: LegalCaseLifecycleStatus.Closed,
      }),
    })

    await expect(
      useCase.execute({ caseId: CASE_ID, actorId: ACTOR_ID, outcome: 'favorable' }),
    ).rejects.toThrow('já está encerrado')
    expect(closureRepository.close).not.toHaveBeenCalled()
  })
})
