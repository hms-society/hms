import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Get Formalization Signature Preview Content Controller [GET /formalizations/:formalizationId/signature-configuration/previews/:previewId/content]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('rejects an invalid preview identifier at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer()).get(
      '/formalizations/00000000-0000-4000-8000-000000000001/signature-configuration/previews/not-a-uuid/content',
    )

    expect(response.status).toBe(400)
  })
})
