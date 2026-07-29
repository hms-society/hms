import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { IntakeFaker } from '../../domain/entities/fakers'
import type { IntakesRepository } from '../../interfaces'
import { ListClientIntakesUseCase } from '../list-client-intakes-use-case'

describe('List Client Intakes Use Case', () => {
  let repository: MockProxy<IntakesRepository>

  beforeEach(() => {
    repository = mock<IntakesRepository>()
  })

  it('lists all Intakes linked to a client', async () => {
    const intakes = IntakeFaker.fakeMany(2)
    repository.findByClientId.mockResolvedValue(intakes)
    const useCase = new ListClientIntakesUseCase(repository)

    await expect(useCase.execute({ clientId: intakes[0].clientId })).resolves.toBe(
      intakes,
    )
  })
})
