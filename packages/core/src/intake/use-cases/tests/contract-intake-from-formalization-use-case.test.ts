import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { IntakeFaker } from '../../domain/entities/fakers'
import {
  IntakeNotFoundError,
  IntakeVersionConflictError,
  InvalidIntakeTransitionError,
} from '../../domain/errors'
import { IntakeStatus } from '../../domain/structures'
import type { IntakesRepository } from '../../interfaces'
import { ContractIntakeFromFormalizationUseCase } from '../contract-intake-from-formalization-use-case'

describe('Contract Intake From Formalization Use Case', () => {
  let repository: MockProxy<IntakesRepository>

  beforeEach(() => {
    repository = mock<IntakesRepository>()
  })

  it('contracts an Intake with the coordinator timestamp and actor', async () => {
    const intake = IntakeFaker.fake({ status: IntakeStatus.InFormalization, version: 4 })
    const contractedAt = new Date('2026-09-01T10:00:00.000Z')
    const updated = IntakeFaker.fake({
      ...intake,
      status: IntakeStatus.Contracted,
      contractedAt,
      updatedBy: 'coordinator',
      version: 5,
    })
    repository.findById.mockResolvedValue(intake)
    repository.replace.mockResolvedValue(updated)

    await expect(
      new ContractIntakeFromFormalizationUseCase(repository).execute({
        intakeId: intake.id,
        expectedVersion: intake.version,
        contractedAt,
        updatedBy: 'coordinator',
      }),
    ).resolves.toBe(updated)
    expect(repository.replace).toHaveBeenCalledWith({
      intakeId: intake.id,
      expectedVersion: intake.version,
      changes: { status: IntakeStatus.Contracted, contractedAt, updatedBy: 'coordinator' },
    })
  })

  it('rejects missing, stale and invalid-state Intakes without a write', async () => {
    const useCase = new ContractIntakeFromFormalizationUseCase(repository)
    repository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        intakeId: 'missing',
        expectedVersion: 1,
        contractedAt: new Date(),
        updatedBy: 'actor',
      }),
    ).rejects.toBeInstanceOf(IntakeNotFoundError)

    const intake = IntakeFaker.fake({ status: IntakeStatus.ViabilityRegistered })
    repository.findById.mockResolvedValue(intake)
    await expect(
      useCase.execute({
        intakeId: intake.id,
        expectedVersion: intake.version,
        contractedAt: new Date(),
        updatedBy: 'actor',
      }),
    ).rejects.toBeInstanceOf(InvalidIntakeTransitionError)
    repository.replace.mockResolvedValue(undefined)
    repository.findById.mockResolvedValue(
      IntakeFaker.fake({ status: IntakeStatus.InFormalization }),
    )
    await expect(
      useCase.execute({
        intakeId: 'stale',
        expectedVersion: 1,
        contractedAt: new Date(),
        updatedBy: 'actor',
      }),
    ).rejects.toBeInstanceOf(IntakeVersionConflictError)
    expect(repository.replace).toHaveBeenCalledTimes(1)
  })
})
