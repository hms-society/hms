import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { SchedulingModuleFixture } from '@/scheduling/fixtures'

describe('Schedules controller access', () => {
  let fixture: SchedulingModuleFixture

  beforeAll(async () => {
    fixture = await SchedulingModuleFixture.register()
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('allows an administrator to read and update a schedule', async () => {
    const { user, collaborator: admin } = await fixture.registerAdmin()
    const { collaborator: lawyer } = await fixture.registerLawyer()
    const seeded = await fixture.seedAppointment(lawyer.id, admin.id)

    const response = await request(fixture.app.getHttpServer())
      .get(`/schedules/collaborator/${lawyer.id}`)
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)
    expect(response.body.id).toBe(seeded.schedule.id)

    const update = await request(fixture.app.getHttpServer())
      .put('/schedules/duration')
      .send({ scheduleId: seeded.schedule.id, defaultDurationMinutes: 60 })
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)
    expect(update.body.id).toBe(seeded.schedule.id)
    const updatedSchedule = await fixture.schedulesRepository.findById(seeded.schedule.id)
    expect(updatedSchedule?.appointmentDurationInMinutes).toBe(60)
  })

  it('rejects unauthenticated and unauthorized schedule writes', async () => {
    await request(fixture.app.getHttpServer())
      .post('/schedules')
      .send({
        collaboratorId: 'not-a-uuid',
        defaultDurationMinutes: 30,
        weeklyAvailability: [],
      })
      .expect(401)

    const { user: attendantUser, collaborator: attendant } =
      await fixture.registerAttendant()
    const { collaborator: lawyer } = await fixture.registerLawyer()
    const { collaborator: anotherLawyer } = await fixture.registerLawyer()
    const seeded = await fixture.seedAppointment(lawyer.id, attendant.id)

    await request(fixture.app.getHttpServer())
      .put('/schedules/duration')
      .send({ scheduleId: seeded.schedule.id, defaultDurationMinutes: 60 })
      .set('Authorization', fixture.authenticateAs(attendantUser))
      .expect(200)

    await request(fixture.app.getHttpServer())
      .post('/schedules')
      .send({
        collaboratorId: anotherLawyer.id,
        defaultDurationMinutes: 30,
        weeklyAvailability: [],
      })
      .set('Authorization', fixture.authenticateAs(attendantUser))
      .expect(201)
  })
})
