import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import { LegalCaseFaker } from '../../domain/entities/fakers'
import type { CaseClosureSnapshot } from '../../domain/structures/case-closure-snapshot'
import { CaseMemberRole, LegalCaseLifecycleStatus } from '../../domain/structures'
import type { CaseClosureAccessProvider, CaseClosureRepository } from '../../interfaces'
import { ReopenLegalCaseUseCase } from '../reopen-legal-case-use-case'

const CASE_ID = 'case-1'
const ACTOR_ID = 'manager-1'
const TEST_AT = new Date('2026-10-15T12:00:00.000Z')

describe('Reopen Legal Case Use Case', () => {
  let closureRepository: MockProxy<CaseClosureRepository>
  let accessProvider: MockProxy<CaseClosureAccessProvider>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: ReopenLegalCaseUseCase
  let snapshot: CaseClosureSnapshot

  beforeEach(() => {
    closureRepository = mock<CaseClosureRepository>()
    accessProvider = mock<CaseClosureAccessProvider>()
    datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(TEST_AT)
    snapshot = {
      legalCase: LegalCaseFaker.fake({
        id: CASE_ID,
        lifecycleStatus: LegalCaseLifecycleStatus.Closed,
      }),
      closure: {
        outcome: 'agreement',
        closedBy: 'manager-previous',
        closedAt: new Date('2026-10-12T12:00:00.000Z'),
      },
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
    useCase = new ReopenLegalCaseUseCase(
      closureRepository,
      accessProvider,
      datetimeProvider,
    )
  })

  it('reopens a closed case with a trimmed reason and preserves the closure record', async () => {
    const reopenedCase = LegalCaseFaker.fake({
      ...snapshot.legalCase,
      lifecycleStatus: LegalCaseLifecycleStatus.Active,
    })
    closureRepository.reopen.mockResolvedValue(reopenedCase)

    await expect(
      useCase.execute({
        caseId: CASE_ID,
        actorId: ACTOR_ID,
        reason: '  Necessário cumprir nova determinação judicial.  ',
      }),
    ).resolves.toBe(reopenedCase)
    expect(closureRepository.reopen).toHaveBeenCalledWith({
      caseId: CASE_ID,
      reason: 'Necessário cumprir nova determinação judicial.',
      actorId: ACTOR_ID,
      occurredAt: TEST_AT,
    })
  })

  it('requires a nonblank reason without mutating the case', async () => {
    await expect(
      useCase.execute({ caseId: CASE_ID, actorId: ACTOR_ID, reason: '  ' }),
    ).rejects.toThrow('motivo da reabertura')
    expect(closureRepository.reopen).not.toHaveBeenCalled()
  })

  it('denies an ineligible actor before mutation', async () => {
    accessProvider.getActorAccess.mockResolvedValue({
      isAuthenticated: true,
      isActive: true,
      isEligible: false,
      role: CaseMemberRole.Manager,
    })

    await expect(
      useCase.execute({ caseId: CASE_ID, actorId: ACTOR_ID, reason: 'Justificativa.' }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(closureRepository.reopen).not.toHaveBeenCalled()
  })

  it('rejects reopening an active case and concurrent transition conflicts', async () => {
    closureRepository.getSnapshot.mockResolvedValue({
      ...snapshot,
      legalCase: LegalCaseFaker.fake({
        id: CASE_ID,
        lifecycleStatus: LegalCaseLifecycleStatus.Active,
      }),
    })

    await expect(
      useCase.execute({ caseId: CASE_ID, actorId: ACTOR_ID, reason: 'Justificativa.' }),
    ).rejects.toThrow('não está encerrado')
    expect(closureRepository.reopen).not.toHaveBeenCalled()
  })
})
