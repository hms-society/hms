import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { IntakeFaker } from '../../domain/entities/fakers'
import { InvalidIntakeTransitionError } from '../../domain/errors'
import { IntakeStatus } from '../../domain/structures'
import type { IntakesRepository } from '../../interfaces'
import { TransitionIntakeStatusUseCase } from '../transition-intake-status-use-case'

describe('Transition Intake Status Use Case', () => {
  let repository: MockProxy<IntakesRepository>

  beforeEach(() => {
    repository = mock<IntakesRepository>()
  })

  it('allows only the next lifecycle transition', async () => {
    const currentIntake = IntakeFaker.fake({
      status: IntakeStatus.ConsultationScheduled,
    })
    const updatedIntake = IntakeFaker.fake({
      id: currentIntake.id,
      status: IntakeStatus.ConsultationCompleted,
      version: currentIntake.version + 1,
    })
    repository.findById.mockResolvedValue(currentIntake)
    repository.replace.mockResolvedValue(updatedIntake)
    const useCase = new TransitionIntakeStatusUseCase(repository)

    await expect(
      useCase.execute({
        intakeId: currentIntake.id,
        expectedVersion: currentIntake.version,
        status: IntakeStatus.ConsultationCompleted,
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

    await expect(
      useCase.execute({
        intakeId: currentIntake.id,
        expectedVersion: currentIntake.version,
        status: IntakeStatus.InFormalization,
        updatedBy: updatedIntake.updatedBy,
      }),
    ).rejects.toBeInstanceOf(InvalidIntakeTransitionError)
  })
})
