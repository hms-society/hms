import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { sql } from 'drizzle-orm'

import { SchedulingModuleFixture } from '@/scheduling/fixtures'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

describe('Scheduling appointment action controllers', () => {
  let fixture: SchedulingModuleFixture

  beforeAll(async () => {
    fixture = await SchedulingModuleFixture.register()
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('maps invalid action input and stale revisions to HTTP errors', async () => {
    const { user, collaborator } = await fixture.registerAdmin()
    const { collaborator: lawyer } = await fixture.registerLawyer()
    const seeded = await fixture.seedAppointment(lawyer.id, collaborator.id)

    await request(fixture.app.getHttpServer())
      .patch(`/scheduling/appointments/${seeded.appointment.id}/cancel`)
      .send({ expectedRevision: 'not-an-iso-date' })
      .set('Authorization', fixture.authenticateAs(user))
      .expect(400)

    await request(fixture.app.getHttpServer())
      .patch(`/scheduling/appointments/${seeded.appointment.id}/cancel`)
      .send({ expectedRevision: '2020-01-01T00:00:00.000Z' })
      .set('Authorization', fixture.authenticateAs(user))
      .expect(409)
  })

  it('cancels and reschedules appointments through the transaction boundary', async () => {
    const { user, collaborator } = await fixture.registerAdmin()
    const { collaborator: lawyer } = await fixture.registerLawyer()
    const seeded = await fixture.seedAppointment(lawyer.id, collaborator.id)

    const cancelled = await request(fixture.app.getHttpServer())
      .patch(`/scheduling/appointments/${seeded.appointment.id}/cancel`)
      .send({ expectedRevision: seeded.appointment.updatedAt.toISOString() })
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)
    expect(cancelled.body.status).toBe('cancelled')

    const fresh = await fixture.appointmentsRepository.findById(seeded.appointment.id)
    expect(fresh?.status).toBe('cancelled')

    const second = await fixture.seedAppointment(lawyer.id, collaborator.id)
    const rescheduled = await request(fixture.app.getHttpServer())
      .patch(`/scheduling/appointments/${second.appointment.id}/reschedule`)
      .send({
        expectedRevision: second.appointment.updatedAt.toISOString(),
        startsAt: '2030-01-14T14:00:00.000Z',
      })
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)
    expect(rescheduled.body.startsAt).toBe('2030-01-14T14:00:00.000Z')
  })

  it('accepts the displayed revision when PostgreSQL stores sub-millisecond precision', async () => {
    const { user, collaborator } = await fixture.registerAdmin()
    const { collaborator: lawyer } = await fixture.registerLawyer()
    const seeded = await fixture.seedAppointment(lawyer.id, collaborator.id)
    const database = fixture.app.get(DrizzleClient).requireDatabase()

    await database.execute(sql`
      update appointments
      set updated_at = '2026-09-28 16:04:18.369079+00'::timestamptz
      where id = ${seeded.appointment.id}::uuid
    `)

    const persisted = await fixture.appointmentsRepository.findById(seeded.appointment.id)
    if (!persisted) throw new Error('Test appointment was not persisted')
    expect(persisted.updatedAt.toISOString()).toBe('2026-09-28T16:04:18.369Z')

    await request(fixture.app.getHttpServer())
      .patch(`/scheduling/appointments/${seeded.appointment.id}/reschedule`)
      .send({
        expectedRevision: persisted.updatedAt.toISOString(),
        startsAt: '2030-01-14T14:00:00.000Z',
      })
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)
  })
})
