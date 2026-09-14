import { describe, expect, it, beforeEach } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DynamicFormListQuery } from '../../domain/structures/dynamic-form-list-query'
import type { DynamicFormListResult } from '../../domain/structures/dynamic-form-list-result'
import type { DynamicFormAdministrationRepository } from '../../interfaces/dynamic-form-administration-repository'
import { ListDynamicFormsForAdministrationUseCase } from '../list-dynamic-forms-for-administration-use-case'

describe('List Dynamic Forms For Administration Use Case', () => {
  let repository: MockProxy<DynamicFormAdministrationRepository>
  let useCase: ListDynamicFormsForAdministrationUseCase

  beforeEach(() => {
    repository = mock<DynamicFormAdministrationRepository>()
    useCase = new ListDynamicFormsForAdministrationUseCase(repository)
  })

  it('lists with the validated query and returns the repository result', async () => {
    const query: DynamicFormListQuery = { page: 1, pageSize: 5, status: 'available' }
    const result: DynamicFormListResult = {
      items: [],
      page: 1,
      pageSize: 5,
      total: 0,
      pageCount: 0,
    }
    repository.list.mockResolvedValue(result)

    await expect(useCase.execute(query)).resolves.toBe(result)
    expect(repository.list).toHaveBeenCalledWith(query)
  })
})
