import { describe, expect, it, vi } from 'vitest'

import { DynamicFormService } from '../dynamic-form-service'

describe('DynamicFormService', () => {
  it('lists dynamic forms with legal context filters', async () => {
    const get = vi.fn().mockResolvedValue({ body: [], isFailure: false })
    const service = DynamicFormService({ get } as never)

    await service.listDynamicForms({
      search: 'triagem',
      legalAreaId: 'area-id',
      legalTopicId: 'topic-id',
    })

    expect(get).toHaveBeenCalledWith(
      '/dynamic-forms?search=triagem&legalAreaId=area-id&legalTopicId=topic-id',
    )
  })
})
