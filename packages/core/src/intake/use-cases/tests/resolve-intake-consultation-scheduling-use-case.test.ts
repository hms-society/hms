import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { IntakeFaker } from '../../domain/entities/fakers'
import { InvalidIntakeTransitionError } from '../../domain/errors'
import {
  IntakeConsultationSchedulingOutcome,
  IntakeStatus,
} from '../../domain/structures'
import type { IntakesRepository } from '../../interfaces'
import { ResolveIntakeConsultationSchedulingUseCase } from '../resolve-intake-consultation-scheduling-use-case'

describe('Resolve Intake Consultation Scheduling Use Case', () => {
  let repository: MockProxy<IntakesRepository>

  beforeEach(() => {
    repository = mock<IntakesRepository>()
  })

  it.each([
    [IntakeConsultationSchedulingOutcome.Scheduled, IntakeStatus.ConsultationScheduled],
    [
      IntakeConsultationSchedulingOutcome.Failed,
      IntakeStatus.ConsultationSchedulingFailed,
    ],
  ] as const)('resolves scheduling as %s', async (outcome, status) => {
    const currentIntake = IntakeFaker.fake({
      status: IntakeStatus.ConsultationScheduling,
    })
    const updatedIntake = IntakeFaker.fake({
      id: currentIntake.id,
      status,
      version: currentIntake.version + 1,
    })
    repository.findById.mockResolvedValue(currentIntake)
    repository.replace.mockResolvedValue(updatedIntake)
    const useCase = new ResolveIntakeConsultationSchedulingUseCase(repository)

    await expect(
      useCase.execute({
        intakeId: currentIntake.id,
        outcome,
        updatedBy: updatedIntake.updatedBy,
      }),
    ).resolves.toBe(updatedIntake)

    expect(repository.replace).toHaveBeenCalledWith({
      intakeId: currentIntake.id,
      expectedVersion: currentIntake.version,
      changes: {
        status,
        updatedBy: updatedIntake.updatedBy,
      },
    })
  })

  it('rejects an outcome after scheduling has already moved forward', async () => {
    const intake = IntakeFaker.fake({ status: IntakeStatus.ConsultationCompleted })
    repository.findById.mockResolvedValue(intake)
    const useCase = new ResolveIntakeConsultationSchedulingUseCase(repository)

    await expect(
      useCase.execute({
        intakeId: intake.id,
        outcome: IntakeConsultationSchedulingOutcome.Failed,
        updatedBy: intake.updatedBy,
      }),
    ).rejects.toBeInstanceOf(InvalidIntakeTransitionError)
  })

  it('completes a successful retry after a definitive scheduling failure', async () => {
    const failedIntake = IntakeFaker.fake({
      status: IntakeStatus.ConsultationSchedulingFailed,
    })
    const scheduledIntake = IntakeFaker.fake({
      id: failedIntake.id,
      status: IntakeStatus.ConsultationScheduled,
      version: failedIntake.version + 1,
    })
    repository.findById.mockResolvedValue(failedIntake)
    repository.replace.mockResolvedValue(scheduledIntake)
    const useCase = new ResolveIntakeConsultationSchedulingUseCase(repository)

    await expect(
      useCase.execute({
        intakeId: failedIntake.id,
        outcome: IntakeConsultationSchedulingOutcome.Scheduled,
        updatedBy: scheduledIntake.updatedBy,
      }),
    ).resolves.toBe(scheduledIntake)
  })
})
