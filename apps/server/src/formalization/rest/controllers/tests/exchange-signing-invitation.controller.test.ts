import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Exchange Signing Invitation Controller [POST /formalizations/signing-gateway/invitations/exchange]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('rejects an invalid invitation payload at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/formalizations/signing-gateway/invitations/exchange')
      .send({})

    expect(response.status).toBe(400)
  })
})
