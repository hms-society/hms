import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CollaboratorProfile } from '../../../identity/domain/structures'
import type { DatetimeProvider } from '../../../shared/interfaces'
import { fakeFormalization } from '../../domain/entities/fakers'
import type { FormalizationIntakeClosureService, FormalizationsRepository } from '../../interfaces'
import { CloseFormalizationWithoutContractUseCase } from '../close-formalization-without-contract-use-case'

describe('Close Formalization Without Contract Use Case', () => {
  let repository: MockProxy<FormalizationsRepository>
  let closureService: MockProxy<FormalizationIntakeClosureService>
  let datetimeProvider: MockProxy<DatetimeProvider>

  beforeEach(() => {
    repository = mock<FormalizationsRepository>()
    closureService = mock<FormalizationIntakeClosureService>()
    datetimeProvider = mock<DatetimeProvider>()
  })

  it('converges the Intake closure and Formalization cancellation', async () => {
    const formalization = fakeFormalization()
    const cancelled = fakeFormalization({ ...formalization, status: 'cancelled' })
    const now = new Date('2026-08-24T14:00:00.000Z')
    repository.findById.mockResolvedValue(formalization)
    repository.replace.mockResolvedValue(cancelled)
    datetimeProvider.now.mockReturnValue(now)

    await expect(
      new CloseFormalizationWithoutContractUseCase(repository, closureService, datetimeProvider).execute({
        formalizationId: formalization.id,
        intakeId: formalization.intakeId,
        actorId: formalization.assignedLawyerId,
        reason: 'client_withdrew',
        expectedVersion: 3,
        expectedFormalizationVersion: formalization.version,
      }),
    ).resolves.toBe(cancelled)
    expect(closureService.closeWithoutContract).toHaveBeenCalledWith(expect.objectContaining({
      intakeId: formalization.intakeId,
      expectedVersion: 3,
    }))
    expect(repository.replace).toHaveBeenCalledWith(expect.objectContaining({
      expectedVersion: formalization.version,
      changes: expect.objectContaining({ status: 'cancelled', cancelledAt: now }),
    }))
  })

  it('allows an admin to operate closure and records the admin actor', async () => {
    const formalization = fakeFormalization()
    const adminId = 'admin-collaborator'
    const cancelled = fakeFormalization({ ...formalization, status: 'cancelled' })
    const now = new Date('2026-08-24T14:00:00.000Z')
    repository.findById.mockResolvedValue(formalization)
    repository.replace.mockResolvedValue(cancelled)
    datetimeProvider.now.mockReturnValue(now)

    await expect(
      new CloseFormalizationWithoutContractUseCase(repository, closureService, datetimeProvider).execute({
        formalizationId: formalization.id,
        intakeId: formalization.intakeId,
        actorId: adminId,
        actorProfile: CollaboratorProfile.Admin,
        reason: 'client_withdrew',
        expectedVersion: 3,
        expectedFormalizationVersion: formalization.version,
      }),
    ).resolves.toBe(cancelled)
    expect(closureService.closeWithoutContract).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: adminId }),
    )
    expect(repository.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: expect.objectContaining({ cancelledByCollaboratorId: adminId }),
      }),
    )
  })
})
