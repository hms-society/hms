import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { IntakeFaker } from '../../domain/entities/fakers'
import type { IntakesRepository } from '../../interfaces'
import { GetIntakeUseCase } from '../get-intake-use-case'

describe('Get Intake Use Case', () => {
  let repository: MockProxy<IntakesRepository>

  beforeEach(() => {
    repository = mock<IntakesRepository>()
  })

  it('returns an Intake by id', async () => {
    const intake = IntakeFaker.fake()
    repository.findById.mockResolvedValue(intake)
    const useCase = new GetIntakeUseCase(repository)

    await expect(useCase.execute({ intakeId: intake.id })).resolves.toBe(intake)
  })

  it('fails when the Intake does not exist', async () => {
    repository.findById.mockResolvedValue(undefined)
    const useCase = new GetIntakeUseCase(repository)

    await expect(useCase.execute({ intakeId: 'missing' })).rejects.toThrow(
      'Intake não encontrado.',
    )
  })
})
