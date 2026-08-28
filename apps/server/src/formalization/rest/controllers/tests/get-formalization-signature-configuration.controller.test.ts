import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Get Formalization Signature Configuration Controller [GET /formalizations/:formalizationId/signature-configuration]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('rejects an invalid Formalization identifier at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer()).get(
      '/formalizations/not-a-uuid/signature-configuration',
    )

    expect(response.status).toBe(400)
  })
})
