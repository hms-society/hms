import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { IntakeFaker } from '../../domain/entities/fakers'
import { IntakeStatus } from '../../domain/structures'
import type { IntakesRepository } from '../../interfaces'
import { CompleteIntakeAfterConsultationUseCase } from '../complete-intake-after-consultation-use-case'

describe('Complete Intake After Consultation Use Case', () => {
  let repository: MockProxy<IntakesRepository>

  beforeEach(() => {
    repository = mock<IntakesRepository>()
  })

  it('moves a scheduled intake to consultation completed', async () => {
    const currentIntake = IntakeFaker.fake({ status: IntakeStatus.ConsultationScheduled })
    const updatedIntake = IntakeFaker.fake({
      id: currentIntake.id,
      status: IntakeStatus.ConsultationCompleted,
      version: currentIntake.version + 1,
    })
    repository.findById.mockResolvedValue(currentIntake)
    repository.replace.mockResolvedValue(updatedIntake)
    const useCase = new CompleteIntakeAfterConsultationUseCase(repository)

    await expect(
      useCase.execute({
        intakeId: currentIntake.id,
        updatedBy: updatedIntake.updatedBy,
      }),
    ).resolves.toBe(updatedIntake)

    expect(repository.replace).toHaveBeenCalledWith({
      intakeId: currentIntake.id,
      expectedVersion: currentIntake.version,
      changes: {
        status: IntakeStatus.ConsultationCompleted,
        updatedBy: updatedIntake.updatedBy,
      },
    })
  })

  it('is idempotent when the intake was already completed', async () => {
    const intake = IntakeFaker.fake({ status: IntakeStatus.ConsultationCompleted })
    repository.findById.mockResolvedValue(intake)
    const useCase = new CompleteIntakeAfterConsultationUseCase(repository)

    await expect(
      useCase.execute({ intakeId: intake.id, updatedBy: intake.updatedBy }),
    ).resolves.toBe(intake)

    expect(repository.replace).not.toHaveBeenCalled()
  })
})
