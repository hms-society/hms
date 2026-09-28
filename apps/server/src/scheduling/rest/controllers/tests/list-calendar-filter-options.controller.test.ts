import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { SchedulingModuleFixture } from '@/scheduling/fixtures'

describe('List Calendar Filter Options Controller [GET /scheduling/calendar/filters]', () => {
  let fixture: SchedulingModuleFixture

  beforeAll(async () => {
    fixture = await SchedulingModuleFixture.register()
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('returns only clients present in the calendar scope', async () => {
    const { user, collaborator } = await fixture.registerAdmin()
    const { collaborator: lawyer } = await fixture.registerLawyer()
    const seeded = await fixture.seedAppointment(lawyer.id, collaborator.id)

    const response = await request(fixture.app.getHttpServer())
      .get('/scheduling/calendar/filters')
      .query({ kind: 'client' })
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)

    expect(response.body.items).toContainEqual({
      id: seeded.client.id,
      name: expect.stringContaining('Cliente do calendário'),
    })
  })
})
