import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DynamicForm } from '../../domain/entities/dynamic-form'
import {
  DynamicFormFieldNotFoundError,
  DynamicFormNotFoundError,
} from '../../domain/errors'
import type { DynamicFormAdministrationRepository } from '../../interfaces/dynamic-form-administration-repository'
import type { DynamicFormUsageProvider } from '../../interfaces/dynamic-form-usage-provider'
import { GetDynamicFormFieldUsageImpactUseCase } from '../get-dynamic-form-field-usage-impact-use-case'

const form: DynamicForm = {
  id: 'form-id',
  name: 'Ficha',
  normalizedName: 'ficha',
  description: null,
  status: 'available',
  stage: 'consultation',
  legalAreaId: 'area-id',
  legalTopicIds: ['topic-id'],
  fields: [
    {
      id: 'field-id',
      key: 'answer',
      label: 'Resposta',
      type: 'short_text',
      position: 0,
      required: false,
    },
  ],
  version: 1,
  createdAt: new Date('2026-09-01T00:00:00.000Z'),
  updatedAt: new Date('2026-09-01T00:00:00.000Z'),
}

describe('Get Dynamic Form Field Usage Impact Use Case', () => {
  let repository: MockProxy<DynamicFormAdministrationRepository>
  let provider: MockProxy<DynamicFormUsageProvider>
  let useCase: GetDynamicFormFieldUsageImpactUseCase

  beforeEach(() => {
    repository = mock<DynamicFormAdministrationRepository>()
    provider = mock<DynamicFormUsageProvider>()
    useCase = new GetDynamicFormFieldUsageImpactUseCase(repository, provider)
  })

  it('returns field impact from the public usage provider', async () => {
    const impact = {
      formalization: { total: 2, inProgress: 0 },
    }
    repository.findById.mockResolvedValue(form)
    provider.getFieldImpact.mockResolvedValue(impact)

    await expect(
      useCase.execute({ dynamicFormId: 'form-id', fieldId: 'field-id' }),
    ).resolves.toBe(impact)
    expect(provider.getFieldImpact).toHaveBeenCalledWith('form-id', 'field-id')
  })

  it('rejects a missing field without reading usage', async () => {
    repository.findById.mockResolvedValue(form)

    await expect(
      useCase.execute({ dynamicFormId: 'form-id', fieldId: 'missing-field' }),
    ).rejects.toBeInstanceOf(DynamicFormFieldNotFoundError)
    expect(provider.getFieldImpact).not.toHaveBeenCalled()
  })

  it('rejects a missing form before checking field membership', async () => {
    repository.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ dynamicFormId: 'missing-form', fieldId: 'field-id' }),
    ).rejects.toBeInstanceOf(DynamicFormNotFoundError)
  })
})
