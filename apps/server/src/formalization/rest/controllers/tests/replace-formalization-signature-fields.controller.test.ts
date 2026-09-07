import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Replace Formalization Signature Fields Controller [PUT /formalizations/:formalizationId/signature-configuration/documents/:documentId/fields]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('rejects non-finite signature geometry at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer())
      .put(
        '/formalizations/00000000-0000-4000-8000-000000000001/signature-configuration/documents/00000000-0000-4000-8000-000000000002/fields',
      )
      .send({
        previewId: '00000000-0000-4000-8000-000000000003',
        expectedVersion: 1,
        fields: [
          {
            fieldId: '00000000-0000-4000-8000-000000000004',
            signatoryId: '00000000-0000-4000-8000-000000000005',
            previewId: '00000000-0000-4000-8000-000000000003',
            type: 'signature',
            page: 1,
            positionX: 80,
            positionY: 10,
            width: 30,
            height: 10,
          },
        ],
      })

    expect(response.status).toBe(400)
  })
})
