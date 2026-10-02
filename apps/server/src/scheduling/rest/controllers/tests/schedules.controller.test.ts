import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { SchedulingModuleFixture } from '@/scheduling/fixtures'

describe('Schedules Controller [GET /schedules/collaborator/:id & PUT /schedules/availability]', () => {
  let fixture: SchedulingModuleFixture

  beforeAll(async () => {
    fixture = await SchedulingModuleFixture.register()
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('authorizes an administrator to read the collaborator schedule', async () => {
    const { user, collaborator } = await fixture.registerAdmin()
    const { collaborator: lawyer } = await fixture.registerLawyer()
    const seeded = await fixture.seedAppointment(lawyer.id, collaborator.id)

    const response = await request(fixture.app.getHttpServer())
      .get(`/schedules/collaborator/${lawyer.id}`)
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)

    expect(response.body.id).toBe(seeded.schedule.id)
  })

  it('allows a lawyer to update their weekly availability and persists it to the database', async () => {
    const { user: lawyerUser, collaborator: lawyer } = await fixture.registerLawyer()
    const seeded = await fixture.seedAppointment(lawyer.id, lawyer.id)

    const newAvailability = [
      {
        weekday: 'monday',
        timeRanges: [
          { startsAt: '08:00', endsAt: '12:00' },
          { startsAt: '14:00', endsAt: '18:00' },
        ],
      },
      {
        weekday: 'friday',
        timeRanges: [{ startsAt: '09:00', endsAt: '13:00' }],
      },
    ]

    await request(fixture.app.getHttpServer())
      .put('/schedules/availability')
      .set('Authorization', fixture.authenticateAs(lawyerUser))
      .send({
        scheduleId: seeded.schedule.id,
        weeklyAvailability: newAvailability,
      })
      .expect(200)

    const getResponse = await request(fixture.app.getHttpServer())
      .get(`/schedules/collaborator/${lawyer.id}`)
      .set('Authorization', fixture.authenticateAs(lawyerUser))
      .expect(200)

    expect(getResponse.body.weeklyAvailability).toEqual(newAvailability)
  })

  it('allows removing all intervals for a day by updating with an empty or modified availability', async () => {
    const { user: lawyerUser, collaborator: lawyer } = await fixture.registerLawyer()
    const seeded = await fixture.seedAppointment(lawyer.id, lawyer.id)

    const updatedAvailability = [
      {
        weekday: 'friday',
        timeRanges: [{ startsAt: '09:00', endsAt: '13:00' }],
      },
    ]

    await request(fixture.app.getHttpServer())
      .put('/schedules/availability')
      .set('Authorization', fixture.authenticateAs(lawyerUser))
      .send({
        scheduleId: seeded.schedule.id,
        weeklyAvailability: updatedAvailability,
      })
      .expect(200)

    const getResponse = await request(fixture.app.getHttpServer())
      .get(`/schedules/collaborator/${lawyer.id}`)
      .set('Authorization', fixture.authenticateAs(lawyerUser))
      .expect(200)

    expect(getResponse.body.weeklyAvailability).toEqual(updatedAvailability)
    expect(
      getResponse.body.weeklyAvailability.find((d: any) => d.weekday === 'monday'),
    ).toBeUndefined()
  })
})
