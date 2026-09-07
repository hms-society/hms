import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Establish Collaborator Signing Session Controller [POST /formalizations/signing-gateway/collaborator/session]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('requires the invitation flow cookie before establishing a session', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/formalizations/signing-gateway/collaborator/session')
      .set('X-HMS-Signing-CSRF', 'csrf-token')

    expect(response.status).toBe(400)
  })
})
