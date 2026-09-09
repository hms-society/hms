import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Get Signing Gateway Context Controller [GET /formalizations/signing-gateway/context]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('requires a signing Gateway session before returning context', async () => {
    const response = await request(fixture.app.getHttpServer()).get(
      '/formalizations/signing-gateway/context',
    )

    expect(response.status).toBe(400)
  })
})
