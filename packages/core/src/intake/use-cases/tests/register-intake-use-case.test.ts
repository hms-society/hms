import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'

import { IntakeFaker } from '../../domain/entities/fakers'
import { InvalidIntakeClosureError } from '../../domain/errors'
import type { IntakesRepository } from '../../interfaces'
import { RegisterIntakeUseCase } from '../register-intake-use-case'

const currentDate = new Date('2026-07-24T12:00:00.000Z')

describe('Register Intake Use Case', () => {
  let repository: MockProxy<IntakesRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>

  beforeEach(() => {
    repository = mock<IntakesRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(currentDate)
  })

  it('registers an Intake with the scheduled status', async () => {
    const registeredIntake = IntakeFaker.fake({ status: 'consultation_scheduled' })
    repository.add.mockResolvedValue(registeredIntake)
    const useCase = new RegisterIntakeUseCase(repository, datetimeProvider)

    const result = await useCase.execute({
      decision: 'schedule_consultation',
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
      expect.objectContaining({ status: 'consultation_scheduled' }),
    )
  })

  it('registers an Intake without scheduling', async () => {
    const registeredIntake = IntakeFaker.fake({ status: 'registered' })
    repository.add.mockResolvedValue(registeredIntake)
    const useCase = new RegisterIntakeUseCase(repository, datetimeProvider)
    const request = {
      decision: 'register_intake' as const,
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
    }

    await expect(useCase.execute(request)).resolves.toBe(registeredIntake)
    expect(repository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: request.clientId,
        status: 'registered',
      }),
    )
  })

  it('registers an Intake already closed using the datetime provider', async () => {
    const registeredIntake = IntakeFaker.fake({
      status: 'closed_without_contract',
      closureReason: 'cliente_desistiu',
      closedAt: currentDate,
    })
    repository.add.mockResolvedValue(registeredIntake)
    const useCase = new RegisterIntakeUseCase(repository, datetimeProvider)

    await useCase.execute({
      decision: 'close_without_contract',
      closureReason: 'cliente_desistiu',
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
        closureReason: 'cliente_desistiu',
        closedAt: currentDate,
      }),
    )
  })

  it('rejects the other closure reason without notes', async () => {
    const intake = IntakeFaker.fake()
    const useCase = new RegisterIntakeUseCase(repository, datetimeProvider)

    await expect(
      useCase.execute({
        decision: 'close_without_contract',
        closureReason: 'outro',
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
    ).rejects.toBeInstanceOf(InvalidIntakeClosureError)
  })
})
