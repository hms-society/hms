import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DynamicForm } from '../../domain/entities/dynamic-form'
import { DynamicFormNotFoundError } from '../../domain/errors'
import type { DynamicFormUsageImpact } from '../../domain/structures/dynamic-form-usage-impact'
import type { DynamicFormAdministrationRepository } from '../../interfaces/dynamic-form-administration-repository'
import type { DynamicFormUsageProvider } from '../../interfaces/dynamic-form-usage-provider'
import { GetDynamicFormUsageImpactUseCase } from '../get-dynamic-form-usage-impact-use-case'

describe('Get Dynamic Form Usage Impact Use Case', () => {
  let repository: MockProxy<DynamicFormAdministrationRepository>
  let provider: MockProxy<DynamicFormUsageProvider>

  const form: DynamicForm = {
    id: 'form-id',
    name: 'Ficha',
    normalizedName: 'ficha',
    description: null,
    status: 'available',
    stage: 'consultation',
    legalAreaId: 'area-id',
    legalTopicIds: [],
    fields: [],
    createdAt: new Date('2026-09-11T12:00:00.000Z'),
    updatedAt: new Date('2026-09-11T12:00:00.000Z'),
  }

  beforeEach(() => {
    repository = mock<DynamicFormAdministrationRepository>()
    provider = mock<DynamicFormUsageProvider>()
  })

  it('returns the live impact supplied by the usage provider', async () => {
    const impact: DynamicFormUsageImpact = {
      consultation: { total: 4, inProgress: 1 },
      formalization: { total: 2, inProgress: 2 },
    }
    repository.findById.mockResolvedValue(form)
    provider.getImpact.mockResolvedValue(impact)
    const useCase = new GetDynamicFormUsageImpactUseCase(repository, provider)

    await expect(useCase.execute({ dynamicFormId: 'form-id' })).resolves.toBe(impact)
    expect(repository.findById).toHaveBeenCalledWith('form-id')
    expect(provider.getImpact).toHaveBeenCalledWith('form-id')
  })

  it('rejects missing definitions before reading usage', async () => {
    repository.findById.mockResolvedValue(null)
    const useCase = new GetDynamicFormUsageImpactUseCase(repository, provider)

    await expect(useCase.execute({ dynamicFormId: 'missing-form-id' })).rejects.toBeInstanceOf(
      DynamicFormNotFoundError,
    )
    expect(provider.getImpact).not.toHaveBeenCalled()
  })
})
