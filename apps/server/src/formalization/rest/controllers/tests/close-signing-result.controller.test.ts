import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Close Signing Result Controller [DELETE /formalizations/signing-gateway/result]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('requires a signing Gateway session before closing the result', async () => {
    const response = await request(fixture.app.getHttpServer())
      .delete('/formalizations/signing-gateway/result')
      .set('X-HMS-Signing-CSRF', 'csrf-token')

    expect(response.status).toBe(400)
  })
})
