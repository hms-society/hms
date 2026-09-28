import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { SchedulingModuleFixture } from '@/scheduling/fixtures'

describe('List Calendar Controller [GET /scheduling/calendar]', () => {
  let fixture: SchedulingModuleFixture

  beforeAll(async () => {
    fixture = await SchedulingModuleFixture.register()
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('returns scheduled events for the requested period', async () => {
    const { user, collaborator } = await fixture.registerAdmin()
    const { collaborator: lawyer } = await fixture.registerLawyer()
    const seeded = await fixture.seedAppointment(lawyer.id, collaborator.id)

    const response = await request(fixture.app.getHttpServer())
      .get('/scheduling/calendar')
      .query({ view: 'week', date: '2030-01-14', event: 'scheduled' })
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)

    expect(response.body).toContainEqual(
      expect.objectContaining({ appointmentId: seeded.appointment.id }),
    )
  })
})
