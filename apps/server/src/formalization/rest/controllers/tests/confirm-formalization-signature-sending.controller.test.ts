import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Confirm Formalization Signature Sending Controller [POST /formalizations/:formalizationId/signature-sending/confirm]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('rejects an invalid Formalization identifier at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/formalizations/not-a-uuid/signature-sending/confirm')
      .send({})

    expect(response.status).toBe(400)
  })
})
