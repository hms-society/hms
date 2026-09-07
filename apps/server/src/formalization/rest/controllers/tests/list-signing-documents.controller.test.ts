import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('List Signing Documents Controller [GET /formalizations/signing-gateway/documents]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('requires a signing Gateway session before listing documents', async () => {
    const response = await request(fixture.app.getHttpServer()).get(
      '/formalizations/signing-gateway/documents',
    )

    expect(response.status).toBe(400)
  })
})
