import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { Broker } from '#shared/interfaces/broker'
import {
  ConsultationChannel,
  ConsultationModality,
} from '#consultation/domain/structures'

import { IntakeFaker } from '../../domain/entities/fakers'
import {
  IntakeConsultationSchedulingRequestedEvent,
  IntakeCreatedEvent,
} from '../../domain/events'
import { IntakeDecision, IntakeStatus } from '../../domain/structures'
import type { IntakesRepository } from '../../interfaces'
import { RegisterIntakeUseCase } from '../register-intake-use-case'

const currentDate = new Date('2026-07-24T12:00:00.000Z')

describe('Register Intake Use Case', () => {
  let repository: MockProxy<IntakesRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let broker: MockProxy<Broker>

  beforeEach(() => {
    repository = mock<IntakesRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    broker = mock<Broker>()
    datetimeProvider.now.mockReturnValue(currentDate)
  })

  it('registers an Intake while consultation scheduling is pending', async () => {
    const registeredIntake = IntakeFaker.fake({
      status: IntakeStatus.ConsultationScheduling,
    })
    repository.add.mockResolvedValue(registeredIntake)
    const useCase = new RegisterIntakeUseCase(repository, datetimeProvider, broker)

    const result = await useCase.execute({
      decision: IntakeDecision.ScheduleConsultation,
      assignedLawyerId: registeredIntake.responsibleId,
      startsAt: currentDate,
      modality: ConsultationModality.Virtual,
      channel: ConsultationChannel.WhatsappVideo,
      clientId: registeredIntake.clientId,
      responsibleId: registeredIntake.responsibleId,
      createdBy: registeredIntake.createdBy,
      updatedBy: registeredIntake.updatedBy,
      origin: registeredIntake.origin,
      contactChannel: registeredIntake.contactChannel,
      legalAreaId: registeredIntake.legalAreaId,
      legalTopicId: registeredIntake.legalTopicId,
      urgency: registeredIntake.urgency,
      demandNotes: registeredIntake.demandNotes,
    })

    expect(result).toBe(registeredIntake)
    expect(repository.add).toHaveBeenCalledWith(
      expect.objectContaining({ status: IntakeStatus.ConsultationScheduling }),
    )
    expect(broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: IntakeCreatedEvent._NAME,
        payload: expect.objectContaining({
          intakeId: registeredIntake.id,
          status: IntakeStatus.ConsultationScheduling,
          occurredAt: currentDate,
        }),
      }),
    )
    expect(broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: IntakeConsultationSchedulingRequestedEvent._NAME,
        payload: expect.objectContaining({
          intakeId: registeredIntake.id,
          assignedLawyerId: registeredIntake.responsibleId,
          requestedBy: registeredIntake.updatedBy,
          occurredAt: currentDate,
        }),
      }),
    )
    expect(repository.add.mock.calls[0]?.[0]).not.toHaveProperty('assignedLawyerId')
  })

  it('registers an Intake without scheduling', async () => {
    const registeredIntake = IntakeFaker.fake({ status: 'registered' })
    repository.add.mockResolvedValue(registeredIntake)
    const useCase = new RegisterIntakeUseCase(repository, datetimeProvider, broker)
    const request = {
      decision: IntakeDecision.RegisterIntake,
      clientId: registeredIntake.clientId,
      responsibleId: registeredIntake.responsibleId,
      createdBy: registeredIntake.createdBy,
      updatedBy: registeredIntake.updatedBy,
      origin: registeredIntake.origin,
      contactChannel: registeredIntake.contactChannel,
      urgency: registeredIntake.urgency,
      demandNotes: registeredIntake.demandNotes,
    }

    await expect(useCase.execute(request)).resolves.toBe(registeredIntake)
    expect(repository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: request.clientId,
        status: 'registered',
      }),
    )
    expect(repository.add.mock.calls[0]?.[0]).not.toHaveProperty('legalAreaId')
    expect(repository.add.mock.calls[0]?.[0]).not.toHaveProperty('legalTopicId')
    expect(broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({ name: IntakeCreatedEvent._NAME }),
    )
  })

  it('registers an Intake already closed using the datetime provider', async () => {
    const registeredIntake = IntakeFaker.fake({
      status: 'closed_without_contract',
      closureReason: 'client_withdrew',
      closedAt: currentDate,
    })
    repository.add.mockResolvedValue(registeredIntake)
    const useCase = new RegisterIntakeUseCase(repository, datetimeProvider, broker)

    await useCase.execute({
      decision: IntakeDecision.CloseWithoutContract,
      closureReason: 'client_withdrew',
      clientId: registeredIntake.clientId,
      responsibleId: registeredIntake.responsibleId,
      createdBy: registeredIntake.createdBy,
      updatedBy: registeredIntake.updatedBy,
      origin: registeredIntake.origin,
      contactChannel: registeredIntake.contactChannel,
      legalAreaId: registeredIntake.legalAreaId,
      legalTopicId: registeredIntake.legalTopicId,
      urgency: registeredIntake.urgency,
      demandNotes: registeredIntake.demandNotes,
    })

    expect(repository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'closed_without_contract',
        closureReason: 'client_withdrew',
        closedAt: currentDate,
      }),
    )
    expect(broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({ name: IntakeCreatedEvent._NAME }),
    )
  })

  it('registers a closed Intake without an observation', async () => {
    const intake = IntakeFaker.fake({ status: 'closed_without_contract' })
    repository.add.mockResolvedValue(intake)
    const useCase = new RegisterIntakeUseCase(repository, datetimeProvider, broker)

    await expect(
      useCase.execute({
        decision: IntakeDecision.CloseWithoutContract,
        closureReason: 'other',
        clientId: intake.clientId,
        responsibleId: intake.responsibleId,
        createdBy: intake.createdBy,
        updatedBy: intake.updatedBy,
        origin: intake.origin,
        contactChannel: intake.contactChannel,
        legalAreaId: intake.legalAreaId,
        legalTopicId: intake.legalTopicId,
        urgency: intake.urgency,
        demandNotes: intake.demandNotes,
      }),
    ).resolves.toBe(intake)

    expect(repository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'closed_without_contract',
        closureReason: 'other',
        closureNotes: undefined,
      }),
    )
  })
})
