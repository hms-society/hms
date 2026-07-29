import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'

import { IntakeFaker } from '../../domain/entities/fakers'
import { InvalidIntakeClosureError } from '../../domain/errors'
import type { IntakesRepository } from '../../interfaces'
import { CloseIntakeWithoutContractUseCase } from '../close-intake-without-contract-use-case'

const currentDate = new Date('2026-07-24T12:00:00.000Z')

describe('Close Intake Without Contract Use Case', () => {
  let repository: MockProxy<IntakesRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>

  beforeEach(() => {
    repository = mock<IntakesRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(currentDate)
  })

  it('closes an active Intake with the selected reason', async () => {
    const currentIntake = IntakeFaker.fake({ status: 'viability_registered' })
    const closedIntake = IntakeFaker.fake({
      id: currentIntake.id,
      status: 'closed_without_contract',
      closureReason: 'other',
      closureNotes: 'Não houve retorno',
      closedAt: currentDate,
    })
    repository.findById.mockResolvedValue(currentIntake)
    repository.replace.mockResolvedValue(closedIntake)
    const useCase = new CloseIntakeWithoutContractUseCase(repository, datetimeProvider)

    await expect(
      useCase.execute({
        intakeId: currentIntake.id,
        expectedVersion: currentIntake.version,
        closureReason: 'other',
        closureNotes: 'Não houve retorno',
        updatedBy: closedIntake.updatedBy,
      }),
    ).resolves.toBe(closedIntake)

    expect(repository.replace).toHaveBeenCalledWith({
      intakeId: currentIntake.id,
      expectedVersion: currentIntake.version,
      changes: {
        status: 'closed_without_contract',
        closureReason: 'other',
        closureNotes: 'Não houve retorno',
        closedAt: currentDate,
        updatedBy: closedIntake.updatedBy,
      },
    })
  })

  it('rejects the other closure reason without notes', async () => {
    const currentIntake = IntakeFaker.fake({ status: 'viability_registered' })
    repository.findById.mockResolvedValue(currentIntake)
    const useCase = new CloseIntakeWithoutContractUseCase(repository, datetimeProvider)

    await expect(
      useCase.execute({
        intakeId: currentIntake.id,
        expectedVersion: currentIntake.version,
        closureReason: 'other',
        updatedBy: currentIntake.updatedBy,
      }),
    ).rejects.toBeInstanceOf(InvalidIntakeClosureError)
  })
})
