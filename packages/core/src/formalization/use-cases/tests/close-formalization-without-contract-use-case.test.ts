import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CollaboratorProfile } from '../../../identity/domain/structures'
import type { DatetimeProvider } from '../../../shared/interfaces'
import { fakeFormalization } from '../../domain/entities/fakers'
import type {
  FormalizationIntakeClosureService,
  FormalizationsRepository,
} from '../../interfaces'
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
    closureService.closeWithoutContract.mockResolvedValue(cancelled)
    datetimeProvider.now.mockReturnValue(now)

    await expect(
      new CloseFormalizationWithoutContractUseCase(
        repository,
        closureService,
        datetimeProvider,
      ).execute({
        formalizationId: formalization.id,
        intakeId: formalization.intakeId,
        actorId: formalization.assignedLawyerId,
        reason: 'client_withdrew',
        expectedVersion: 3,
        expectedFormalizationVersion: formalization.version,
      }),
    ).resolves.toBe(cancelled)
    expect(closureService.closeWithoutContract).toHaveBeenCalledWith(
      expect.objectContaining({
        formalizationId: formalization.id,
        intakeId: formalization.intakeId,
        actorId: formalization.assignedLawyerId,
        expectedIntakeVersion: 3,
        expectedFormalizationVersion: formalization.version,
        cancelledAt: now,
      }),
    )
    expect(repository.replace).not.toHaveBeenCalled()
  })

  it('rejects an Intake mismatch before invoking the closure boundary', async () => {
    const formalization = fakeFormalization()
    repository.findById.mockResolvedValue(formalization)

    await expect(
      new CloseFormalizationWithoutContractUseCase(
        repository,
        closureService,
        datetimeProvider,
      ).execute({
        formalizationId: formalization.id,
        intakeId: 'another-intake',
        actorId: formalization.assignedLawyerId,
        reason: 'client_withdrew',
        expectedVersion: 3,
        expectedFormalizationVersion: formalization.version,
      }),
    ).rejects.toThrow('não pertence à formalização autorizada')
    expect(closureService.closeWithoutContract).not.toHaveBeenCalled()
    expect(repository.replace).not.toHaveBeenCalled()
  })

  it('does not perform a second persistence step when the atomic closure fails', async () => {
    const formalization = fakeFormalization()
    const conflict = new Error('closure CAS conflict')
    repository.findById.mockResolvedValue(formalization)
    closureService.closeWithoutContract.mockRejectedValue(conflict)

    await expect(
      new CloseFormalizationWithoutContractUseCase(
        repository,
        closureService,
        datetimeProvider,
      ).execute({
        formalizationId: formalization.id,
        intakeId: formalization.intakeId,
        actorId: formalization.assignedLawyerId,
        reason: 'client_withdrew',
        expectedVersion: 3,
        expectedFormalizationVersion: formalization.version,
      }),
    ).rejects.toBe(conflict)
    expect(repository.replace).not.toHaveBeenCalled()
  })

  it('allows an admin to operate closure and records the admin actor', async () => {
    const formalization = fakeFormalization()
    const adminId = 'admin-collaborator'
    const cancelled = fakeFormalization({ ...formalization, status: 'cancelled' })
    const now = new Date('2026-08-24T14:00:00.000Z')
    repository.findById.mockResolvedValue(formalization)
    closureService.closeWithoutContract.mockResolvedValue(cancelled)
    datetimeProvider.now.mockReturnValue(now)

    await expect(
      new CloseFormalizationWithoutContractUseCase(
        repository,
        closureService,
        datetimeProvider,
      ).execute({
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
    expect(repository.replace).not.toHaveBeenCalled()
  })
})
