import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Replace Formalization Contract Form Controller [PUT /formalizations/:formalizationId/contract-form/definition]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('rejects an invalid Formalization identifier at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer())
      .put('/formalizations/not-a-uuid/contract-form/definition')
      .send({})

    expect(response.status).toBe(400)
  })
})
