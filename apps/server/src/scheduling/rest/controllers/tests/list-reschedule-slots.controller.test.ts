import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { SchedulingModuleFixture } from '@/scheduling/fixtures'

describe('List Reschedule Slots Controller [GET /scheduling/appointments/:id/slots]', () => {
  let fixture: SchedulingModuleFixture

  beforeAll(async () => {
    fixture = await SchedulingModuleFixture.register()
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('returns available future slots for a scheduled appointment', async () => {
    const { user, collaborator } = await fixture.registerAdmin()
    const { collaborator: lawyer } = await fixture.registerLawyer()
    const seeded = await fixture.seedAppointment(lawyer.id, collaborator.id)

    const response = await request(fixture.app.getHttpServer())
      .get(`/scheduling/appointments/${seeded.appointment.id}/slots`)
      .query({ date: '2030-01-14' })
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)

    expect(response.body.length).toBeGreaterThan(0)
  })
})
