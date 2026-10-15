import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import request from 'supertest'

import { SchedulingModuleFixture } from '@/scheduling/fixtures'

describe('Cancel Appointment Controller [PATCH /scheduling/appointments/:id/cancel]', () => {
  let fixture: SchedulingModuleFixture

  beforeAll(async () => {
    fixture = await SchedulingModuleFixture.register()
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('requires authentication', async () => {
    await request(fixture.app.getHttpServer())
      .patch('/scheduling/appointments/a4337a86-6835-4ca9-95b5-9259609d8cf6/cancel')
      .send({ expectedRevision: '2030-01-01T12:00:00.000Z' })
      .expect(401)
  })
})
