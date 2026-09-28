import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { SchedulingModuleFixture } from '@/scheduling/fixtures'

describe('Reschedule Appointment Controller [PATCH /scheduling/appointments/:id/reschedule]', () => {
  let fixture: SchedulingModuleFixture

  beforeAll(async () => {
    fixture = await SchedulingModuleFixture.register()
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('persists a reschedule through the controller transaction', async () => {
    const { user, collaborator } = await fixture.registerAdmin()
    const { collaborator: lawyer } = await fixture.registerLawyer()
    const seeded = await fixture.seedAppointment(lawyer.id, collaborator.id)

    const response = await request(fixture.app.getHttpServer())
      .patch(`/scheduling/appointments/${seeded.appointment.id}/reschedule`)
      .send({
        expectedRevision: seeded.appointment.updatedAt.toISOString(),
        startsAt: '2030-01-14T14:00:00.000Z',
      })
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)

    expect(response.body.startsAt).toBe('2030-01-14T14:00:00.000Z')
  })
})
