import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Confirm Formalization Documents Controller [PATCH /formalizations/:formalizationId/documents/confirm]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('rejects an invalid expected version before application dispatch', async () => {
    const response = await request(fixture.app.getHttpServer())
      .patch('/formalizations/00000000-0000-4000-8000-000000000001/documents/confirm')
      .send({ expectedVersion: 0 })

    expect(response.status).toBe(400)
  })
})
