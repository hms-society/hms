import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Cancel Formalization Document Generation Controller [PATCH /formalizations/:formalizationId/document-generations/:generationId/cancel]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('rejects an invalid Formalization identifier at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer()).patch(
      '/formalizations/not-a-uuid/document-generations/00000000-0000-4000-8000-000000000001/cancel',
    )

    expect(response.status).toBe(400)
  })
})
