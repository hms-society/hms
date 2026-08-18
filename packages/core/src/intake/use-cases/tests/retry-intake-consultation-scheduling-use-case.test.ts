import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import {
  ConsultationChannel,
  ConsultationModality,
} from '#consultation/domain/structures'
import type { Broker, DatetimeProvider } from '#shared/interfaces'

import { IntakeFaker } from '../../domain/entities/fakers'
import {
  IntakeNotFoundError,
  IntakeVersionConflictError,
  InvalidIntakeTransitionError,
} from '../../domain/errors'
import { IntakeConsultationSchedulingRequestedEvent } from '../../domain/events'
import { IntakeStatus } from '../../domain/structures'
import type { IntakesRepository } from '../../interfaces'
import { RetryIntakeConsultationSchedulingUseCase } from '../retry-intake-consultation-scheduling-use-case'

const currentDate = new Date('2026-08-12T15:00:00.000Z')

describe('Retry Intake Consultation Scheduling Use Case', () => {
  let repository: MockProxy<IntakesRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let broker: MockProxy<Broker>

  beforeEach(() => {
    repository = mock<IntakesRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    broker = mock<Broker>()
    datetimeProvider.now.mockReturnValue(currentDate)
  })

  it('retries a failed consultation scheduling request', async () => {
    const failedIntake = IntakeFaker.fake({
      status: IntakeStatus.ConsultationSchedulingFailed,
    })
    const retriedIntake = IntakeFaker.fake({
      ...failedIntake,
      status: IntakeStatus.ConsultationScheduling,
      version: failedIntake.version + 1,
    })
    repository.findById.mockResolvedValue(failedIntake)
    repository.replace.mockResolvedValue(retriedIntake)
    const useCase = new RetryIntakeConsultationSchedulingUseCase(
      repository,
      datetimeProvider,
      broker,
    )

    await expect(
      useCase.execute({
        intakeId: failedIntake.id,
        assignedLawyerId: failedIntake.responsibleId,
        startsAt: currentDate,
        modality: ConsultationModality.Virtual,
        channel: ConsultationChannel.GoogleMeet,
        requestedBy: failedIntake.updatedBy,
      }),
    ).resolves.toBe(retriedIntake)

    expect(broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: IntakeConsultationSchedulingRequestedEvent._NAME,
        payload: expect.objectContaining({
          intakeId: retriedIntake.id,
          occurredAt: currentDate,
        }),
      }),
    )
  })

  it('rejects retrying an intake that has not failed', async () => {
    const intake = IntakeFaker.fake({ status: IntakeStatus.ConsultationScheduled })
    repository.findById.mockResolvedValue(intake)
    const useCase = new RetryIntakeConsultationSchedulingUseCase(
      repository,
      datetimeProvider,
      broker,
    )

    await expect(
      useCase.execute({
        intakeId: intake.id,
        assignedLawyerId: intake.responsibleId,
        startsAt: currentDate,
        modality: ConsultationModality.InPerson,
        requestedBy: intake.updatedBy,
      }),
    ).rejects.toBeInstanceOf(InvalidIntakeTransitionError)
  })

  it('rejects retrying an unknown intake', async () => {
    const useCase = new RetryIntakeConsultationSchedulingUseCase(
      repository,
      datetimeProvider,
      broker,
    )

    await expect(
      useCase.execute({
        intakeId: 'dbafc20d-edeb-463a-ad94-f9bb92ea8a3c',
        assignedLawyerId: 'd482d3ed-e7b6-4385-b7f6-574c323736ab',
        startsAt: currentDate,
        modality: ConsultationModality.InPerson,
        requestedBy: '5e595e91-24a9-49f5-a294-bcad7e29abc6',
      }),
    ).rejects.toBeInstanceOf(IntakeNotFoundError)
  })

  it('rejects a concurrent retry', async () => {
    const intake = IntakeFaker.fake({
      status: IntakeStatus.ConsultationSchedulingFailed,
    })
    repository.findById.mockResolvedValue(intake)
    const useCase = new RetryIntakeConsultationSchedulingUseCase(
      repository,
      datetimeProvider,
      broker,
    )

    await expect(
      useCase.execute({
        intakeId: intake.id,
        assignedLawyerId: intake.responsibleId,
        startsAt: currentDate,
        modality: ConsultationModality.InPerson,
        requestedBy: intake.updatedBy,
      }),
    ).rejects.toBeInstanceOf(IntakeVersionConflictError)
  })
})
