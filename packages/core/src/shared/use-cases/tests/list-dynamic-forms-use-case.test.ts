import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DynamicForm } from '../../domain'
import type { DynamicFormsRepository } from '../../interfaces'
import { ListDynamicFormsUseCase } from '../list-dynamic-forms-use-case'

describe('ListDynamicFormsUseCase', () => {
  let repository: MockProxy<DynamicFormsRepository>
  let useCase: ListDynamicFormsUseCase

  beforeEach(() => {
    repository = mock<DynamicFormsRepository>()
    useCase = new ListDynamicFormsUseCase(repository)
  })

  it('returns available forms that match the legal area and topic', async () => {
    repository.list.mockResolvedValue([
      makeForm({
        id: 'form-civil',
        name: 'Triagem Cível',
        legalAreaId: 'area-civil',
        legalTopicIds: ['topic-contracts'],
      }),
      makeForm({
        id: 'form-family',
        name: 'Triagem Família',
        legalAreaId: 'area-family',
        legalTopicIds: ['topic-divorce'],
      }),
      makeForm({
        id: 'form-unavailable',
        name: 'Ficha indisponível',
        status: 'unavailable',
        legalAreaId: 'area-civil',
        legalTopicIds: ['topic-contracts'],
      }),
    ])

    const forms = await useCase.execute({
      query: {
        legalAreaId: 'area-civil',
        legalTopicId: 'topic-contracts',
      },
    })

    expect(forms.map(({ id }) => id)).toEqual(['form-civil'])
  })

  it('filters available forms by name', async () => {
    repository.list.mockResolvedValue([
      makeForm({ id: 'form-one', name: 'Triagem Cível' }),
      makeForm({ id: 'form-two', name: 'Entrevista Cível' }),
    ])

    const forms = await useCase.execute({ query: { search: 'entrevista' } })

    expect(forms.map(({ id }) => id)).toEqual(['form-two'])
  })
})

function makeForm(overrides: {
  id: string
  name: string
  status?: 'available' | 'unavailable'
  legalAreaId?: string
  legalTopicIds?: string[]
}): DynamicForm {
  return {
    id: overrides.id,
    name: overrides.name,
    status: overrides.status ?? 'available',
    contexts: [
      {
        type: 'legal',
        data: {
          legalAreaId: overrides.legalAreaId ?? 'area-civil',
          legalTopicIds: overrides.legalTopicIds ?? ['topic-contracts'],
        },
      },
    ],
    fields: [],
    createdAt: new Date('2026-08-18T00:00:00.000Z'),
    updatedAt: new Date('2026-08-18T00:00:00.000Z'),
  }
}
