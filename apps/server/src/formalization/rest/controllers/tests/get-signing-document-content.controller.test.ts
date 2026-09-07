import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Get Signing Document Content Controller [GET /formalizations/signing-gateway/documents/:requestDocumentId/content]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('requires a signing Gateway session before reading document content', async () => {
    const response = await request(fixture.app.getHttpServer()).get(
      '/formalizations/signing-gateway/documents/00000000-0000-4000-8000-000000000001/content',
    )

    expect(response.status).toBe(400)
  })
})
