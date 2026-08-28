import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Select Formalization Signatory Channel Controller [PUT /formalizations/:formalizationId/signature-configuration/signatories/:signatoryId/channel]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('rejects channels outside the shared communication contract', async () => {
    const response = await request(fixture.app.getHttpServer())
      .put(
        '/formalizations/00000000-0000-4000-8000-000000000001/signature-configuration/signatories/00000000-0000-4000-8000-000000000002/channel',
      )
      .send({ channel: 'sms', expectedVersion: 1 })

    expect(response.status).toBe(400)
  })
})
