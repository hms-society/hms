import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Request Signing OTP Controller [POST /formalizations/signing-gateway/otp]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('rejects an invalid OTP request payload at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/formalizations/signing-gateway/otp')
      .send({})

    expect(response.status).toBe(400)
  })
})
