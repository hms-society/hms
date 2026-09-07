import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Close Formalization Contract Form Controller [PATCH /formalizations/:formalizationId/contract-form/close]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('rejects an invalid Formalization identifier at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer())
      .patch('/formalizations/not-a-uuid/contract-form/close')
      .send({})

    expect(response.status).toBe(400)
  })
})
