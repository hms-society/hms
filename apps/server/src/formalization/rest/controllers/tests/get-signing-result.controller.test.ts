import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Get Signing Result Controller [GET /formalizations/signing-gateway/result]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('requires a signing Gateway session before returning the result', async () => {
    const response = await request(fixture.app.getHttpServer()).get(
      '/formalizations/signing-gateway/result',
    )

    expect(response.status).toBe(400)
  })
})
