import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Start Signing Controller [POST /formalizations/signing-gateway/signing]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('rejects an invalid signing request payload at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/formalizations/signing-gateway/signing')
      .send({})

    expect(response.status).toBe(400)
  })
})
