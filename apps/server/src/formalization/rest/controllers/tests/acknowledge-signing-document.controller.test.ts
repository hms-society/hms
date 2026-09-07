import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Acknowledge Signing Document Controller [POST /formalizations/signing-gateway/documents/:requestDocumentId/acknowledgement]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('requires a signing Gateway session before acknowledging a document', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post(
        '/formalizations/signing-gateway/documents/00000000-0000-4000-8000-000000000001/acknowledgement',
      )
      .set('X-HMS-Signing-CSRF', 'csrf-token')
      .send({ expectedRequestVersion: 1, acknowledged: true })

    expect(response.status).toBe(400)
  })
})
