import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { SchedulingModuleFixture } from '@/scheduling/fixtures'

describe('Get Appointment Details Controller [GET /scheduling/appointments/:id]', () => {
  let fixture: SchedulingModuleFixture

  beforeAll(async () => {
    fixture = await SchedulingModuleFixture.register()
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('returns persisted appointment details for an administrator', async () => {
    const { user, collaborator } = await fixture.registerAdmin()
    const { collaborator: lawyer } = await fixture.registerLawyer()
    const seeded = await fixture.seedAppointment(lawyer.id, collaborator.id)

    const response = await request(fixture.app.getHttpServer())
      .get(`/scheduling/appointments/${seeded.appointment.id}`)
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)

    expect(response.body).toMatchObject({
      appointmentId: seeded.appointment.id,
      scheduleId: seeded.schedule.id,
      changes: [],
    })
  })
})
