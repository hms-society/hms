import { describe, expect, it } from 'vitest'

import type { DynamicForm } from '@hms/core/shared/domain'
import type { DynamicFormsRepository } from '@hms/core/shared/interfaces'

import { ListDynamicFormsController } from '@/shared/rest/controllers'

describe('ListDynamicFormsController', () => {
  it('returns available forms filtered by the legal context', async () => {
    const form = makeForm()
    const repository: DynamicFormsRepository = {
      list: async () => [form],
      addMany: async () => [],
      removeAll: async () => undefined,
    }
    const controller = new ListDynamicFormsController(repository)

    const response = await controller.handle({
      legalAreaId: 'area-civil',
      legalTopicId: 'topic-contracts',
    })

    expect(response).toHaveLength(1)
    expect(response[0]).toMatchObject({ id: form.id, name: form.name })
  })
})

function makeForm(): DynamicForm {
  return {
    id: 'form-civil',
    name: 'Triagem Cível',
    status: 'available',
    contexts: [
      {
        type: 'legal',
        data: {
          legalAreaId: 'area-civil',
          legalTopicIds: ['topic-contracts'],
        },
      },
    ],
    fields: [],
    createdAt: new Date('2026-08-18T00:00:00.000Z'),
    updatedAt: new Date('2026-08-18T00:00:00.000Z'),
  }
}
