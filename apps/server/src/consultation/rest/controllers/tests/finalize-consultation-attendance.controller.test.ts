import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import request from 'supertest'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { FinalizeConsultationAttendanceController } from '@/consultation/rest/controllers'

describe('Finalize Consultation Attendance Controller [PATCH /consultations/:id/attendance/finalize]', () => {
  let fixture: ConsultationModuleFixture

  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(
      FinalizeConsultationAttendanceController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('requires authentication before validating the attendance request', async () => {
    await request(fixture.app.getHttpServer())
      .patch('/consultations/a4337a86-6835-4ca9-95b5-9259609d8cf6/attendance/finalize')
      .send({ answers: {} })
      .expect(401)
  })
})
