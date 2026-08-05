import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'

import type { IntakeResponsiblesRepository } from '../../../identity/interfaces'
import { ListIntakeResponsiblesUseCase } from '../list-intake-responsibles-use-case'

describe('List Intake Responsibles Use Case', () => {
  it('lists responsible options through the repository', async () => {
    const repository = mock<IntakeResponsiblesRepository>()
    const responsibles = [
      { responsibleId: 'responsible-1', professionalName: 'Responsável Teste' },
    ]
    repository.listResponsibleOptions.mockResolvedValue(responsibles)

    const useCase = new ListIntakeResponsiblesUseCase(repository)

    await expect(useCase.execute()).resolves.toBe(responsibles)
    expect(repository.listResponsibleOptions).toHaveBeenCalledOnce()
  })
})
