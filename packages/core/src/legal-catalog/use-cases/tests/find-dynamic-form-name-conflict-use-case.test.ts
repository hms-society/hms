import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DynamicForm } from '../../domain/entities/dynamic-form'
import type { DynamicFormAdministrationRepository } from '../../interfaces/dynamic-form-administration-repository'
import { FindDynamicFormNameConflictUseCase } from '../find-dynamic-form-name-conflict-use-case'

const form = { id: 'form-1' } as DynamicForm

describe('Find Dynamic Form Name Conflict Use Case', () => {
  let repository: MockProxy<DynamicFormAdministrationRepository>
  let useCase: FindDynamicFormNameConflictUseCase

  beforeEach(() => {
    repository = mock<DynamicFormAdministrationRepository>()
    useCase = new FindDynamicFormNameConflictUseCase(repository)
  })

  it('normalizes the name before looking for an existing form', async () => {
    repository.findByNormalizedName.mockResolvedValue(form)

    await expect(useCase.execute({ name: '  Ficha Única  ' })).resolves.toEqual({
      conflict: true,
      existingDynamicFormId: 'form-1',
    })
    expect(repository.findByNormalizedName).toHaveBeenCalledWith('ficha única')
  })

  it('returns no conflict when the normalized name is unused', async () => {
    repository.findByNormalizedName.mockResolvedValue(null)

    await expect(useCase.execute({ name: 'Ficha nova' })).resolves.toEqual({
      conflict: false,
    })
  })
})
