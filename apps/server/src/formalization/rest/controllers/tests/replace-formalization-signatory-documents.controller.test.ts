import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Replace Formalization Signatory Documents Controller [PUT /formalizations/:formalizationId/signature-configuration/signatories/:signatoryId/documents]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('rejects duplicate document identifiers before application dispatch', async () => {
    const documentId = '00000000-0000-4000-8000-000000000003'
    const response = await request(fixture.app.getHttpServer())
      .put(
        '/formalizations/00000000-0000-4000-8000-000000000001/signature-configuration/signatories/00000000-0000-4000-8000-000000000002/documents',
      )
      .send({ documentIds: [documentId, documentId], expectedVersion: 1 })

    expect(response.status).toBe(400)
  })
})
