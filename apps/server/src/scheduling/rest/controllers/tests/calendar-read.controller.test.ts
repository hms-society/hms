import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { SchedulingModuleFixture } from '@/scheduling/fixtures'

describe('Scheduling calendar read controllers', () => {
  let fixture: SchedulingModuleFixture

  beforeAll(async () => {
    fixture = await SchedulingModuleFixture.register()
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('requires authentication and validates calendar queries', async () => {
    await request(fixture.app.getHttpServer()).get('/scheduling/calendar').expect(401)

    const { user } = await fixture.registerAdmin()
    await request(fixture.app.getHttpServer())
      .get('/scheduling/calendar')
      .query({ view: 'week', date: 'not-a-date' })
      .set('Authorization', fixture.authenticateAs(user))
      .expect(400)
  })

  it('lists calendar events, filter options, details and future slots', async () => {
    const { user, collaborator: admin } = await fixture.registerAdmin()
    const { collaborator: lawyer } = await fixture.registerLawyer()
    const seeded = await fixture.seedAppointment(lawyer.id, admin.id)

    const calendar = await request(fixture.app.getHttpServer())
      .get('/scheduling/calendar')
      .query({ view: 'week', date: '2030-01-14', event: 'scheduled' })
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)
    expect(calendar.body).toHaveLength(1)
    expect(calendar.body[0]).toMatchObject({
      kind: 'appointment',
      appointmentId: seeded.appointment.id,
      clientId: seeded.client.id,
      lawyerId: lawyer.id,
    })
    expect(calendar.body[0].clientName).toContain('Cliente do calendário')

    const filters = await request(fixture.app.getHttpServer())
      .get('/scheduling/calendar/filters')
      .query({ kind: 'client', search: 'calendário' })
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)
    expect(filters.body.items).toContainEqual({
      id: seeded.client.id,
      name: expect.stringContaining('Cliente do calendário'),
    })

    const details = await request(fixture.app.getHttpServer())
      .get(`/scheduling/appointments/${seeded.appointment.id}`)
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)
    expect(details.body).toMatchObject({
      appointmentId: seeded.appointment.id,
      scheduleId: seeded.schedule.id,
      changes: [],
    })

    const slots = await request(fixture.app.getHttpServer())
      .get(`/scheduling/appointments/${seeded.appointment.id}/slots`)
      .query({ date: '2030-01-14' })
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)
    expect(slots.body.length).toBeGreaterThan(0)
    expect(slots.body).toContainEqual(
      expect.objectContaining({ startsAt: '2030-01-14T13:00:00.000Z' }),
    )
  })

  it('hides another lawyer appointment from a lawyer actor', async () => {
    const { user: firstUser, collaborator: firstLawyer } = await fixture.registerLawyer()
    const { user: secondUser, collaborator: secondLawyer } =
      await fixture.registerLawyer()
    const seeded = await fixture.seedAppointment(firstLawyer.id, firstLawyer.id)

    await request(fixture.app.getHttpServer())
      .get(`/scheduling/appointments/${seeded.appointment.id}`)
      .set('Authorization', fixture.authenticateAs(secondUser))
      .expect(404)

    expect(firstUser.id).not.toBe(secondUser.id)
    expect(secondLawyer.id).not.toBe(firstLawyer.id)
  })
})
