import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DynamicForm } from '../../domain/entities/dynamic-form'
import type { LegalArea, LegalTopic } from '../../domain/entities'
import {
  DynamicFormDefinitionValidationError,
  DynamicFormNotFoundError,
} from '../../domain/errors'
import type { DynamicFormAdministrationRepository } from '../../interfaces/dynamic-form-administration-repository'
import type { LegalAreasRepository } from '../../interfaces/legal-areas-repository'
import type { LegalTopicsRepository } from '../../interfaces/legal-topics-repository'
import { GetDynamicFormForAdministrationUseCase } from '../get-dynamic-form-for-administration-use-case'

const form: DynamicForm = {
  id: 'form-id',
  name: 'Ficha',
  normalizedName: 'ficha',
  description: null,
  status: 'available',
  stage: 'formalization',
  legalAreaId: 'area-id',
  legalTopicIds: ['topic-2', 'topic-1'],
  fields: [],
  version: 2,
  createdAt: new Date('2026-09-01T00:00:00.000Z'),
  updatedAt: new Date('2026-09-01T00:00:00.000Z'),
}

const area: LegalArea = {
  id: 'area-id',
  name: 'Contratos',
  active: false,
  createdAt: new Date('2026-09-01T00:00:00.000Z'),
  updatedAt: new Date('2026-09-01T00:00:00.000Z'),
}

const topics: LegalTopic[] = [
  {
    id: 'topic-1',
    legalAreaId: 'area-id',
    name: 'Compra',
    active: true,
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-09-01T00:00:00.000Z'),
  },
  {
    id: 'topic-2',
    legalAreaId: 'area-id',
    name: 'Venda',
    active: false,
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-09-01T00:00:00.000Z'),
  },
]

describe('Get Dynamic Form For Administration Use Case', () => {
  let repository: MockProxy<DynamicFormAdministrationRepository>
  let areas: MockProxy<LegalAreasRepository>
  let legalTopics: MockProxy<LegalTopicsRepository>
  let useCase: GetDynamicFormForAdministrationUseCase

  beforeEach(() => {
    repository = mock<DynamicFormAdministrationRepository>()
    areas = mock<LegalAreasRepository>()
    legalTopics = mock<LegalTopicsRepository>()
    useCase = new GetDynamicFormForAdministrationUseCase(repository, areas, legalTopics)
  })

  it('hydrates selected active and inactive classifications in persisted order', async () => {
    repository.findById.mockResolvedValue(form)
    areas.findByIds.mockResolvedValue([area])
    legalTopics.findByIds.mockResolvedValue(topics)

    await expect(useCase.execute({ dynamicFormId: 'form-id' })).resolves.toEqual({
      form,
      legalArea: area,
      legalTopics: [topics[1], topics[0]],
    })
    expect(areas.findByIds).toHaveBeenCalledWith(['area-id'])
    expect(legalTopics.findByIds).toHaveBeenCalledWith(['topic-2', 'topic-1'])
  })

  it('rejects a missing form before reading classifications', async () => {
    repository.findById.mockResolvedValue(null)

    await expect(useCase.execute({ dynamicFormId: 'missing-id' })).rejects.toBeInstanceOf(
      DynamicFormNotFoundError,
    )
    expect(areas.findByIds).not.toHaveBeenCalled()
  })

  it('fails safely when a persisted classification relationship is missing', async () => {
    repository.findById.mockResolvedValue(form)
    areas.findByIds.mockResolvedValue([])
    legalTopics.findByIds.mockResolvedValue([topics[0]])

    await expect(useCase.execute({ dynamicFormId: 'form-id' })).rejects.toBeInstanceOf(
      DynamicFormDefinitionValidationError,
    )
  })
})
