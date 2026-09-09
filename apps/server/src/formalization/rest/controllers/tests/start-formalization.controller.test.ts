import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Start Formalization Controller [POST /formalizations/by-intake/:intakeId/start]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('rejects an invalid Intake identifier at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer()).post(
      '/formalizations/by-intake/not-a-uuid/start',
    )

    expect(response.status).toBe(400)
  })
})
