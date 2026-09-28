import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import request from 'supertest'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { CompleteConsultationController } from '@/consultation/rest/controllers'

describe('Complete Consultation Controller [PATCH /consultations/:id/complete]', () => {
  let fixture: ConsultationModuleFixture

  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(CompleteConsultationController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('rejects unauthenticated requests', async () => {
    await request(fixture.app.getHttpServer())
      .patch('/consultations/a4337a86-6835-4ca9-95b5-9259609d8cf6/complete')
      .expect(401)
  })
})
