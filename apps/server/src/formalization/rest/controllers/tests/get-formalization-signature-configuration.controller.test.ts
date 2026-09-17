import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { fakeFormalization } from '@hms/core/formalization/domain/entities/fakers'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Get Formalization Signature Configuration Controller [GET /formalizations/:formalizationId/signature-configuration]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture?.close())

  it('rejects an invalid Formalization identifier at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer()).get(
      '/formalizations/not-a-uuid/signature-configuration',
    )

    expect(response.status).toBe(400)
  })

  it('returns the locked configuration when no signature configuration exists', async () => {
    const formalizationId = fixture.idProvider.generate()
    await fixture.formalizationsRepository.addOrGet(
      fakeFormalization({
        id: formalizationId,
        assignedLawyerId: fixture.collaboratorId,
      }),
    )

    const response = await request(fixture.app.getHttpServer()).get(
      `/formalizations/${formalizationId}/signature-configuration`,
    )

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      formalizationId,
      version: 1,
      editable: false,
      status: 'initialization_required',
      signatories: [],
      documents: [],
      readiness: {
        ready: false,
        assignmentCount: 0,
        issues: [{ path: 'configuration', code: 'initialization_required' }],
      },
    })
  })
})
