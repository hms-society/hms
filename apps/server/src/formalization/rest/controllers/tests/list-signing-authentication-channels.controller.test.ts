import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('List Signing Authentication Channels Controller [GET /formalizations/signing-gateway/channels]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('requires a signing Gateway session before listing channels', async () => {
    const response = await request(fixture.app.getHttpServer()).get(
      '/formalizations/signing-gateway/channels',
    )

    expect(response.status).toBe(400)
  })
})
