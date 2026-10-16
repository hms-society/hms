import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { ScheduleFaker } from '@hms/core/scheduling/domain/entities/fakers'

import { SchedulingModuleFixture } from '@/scheduling/fixtures'

describe('Schedules Controller [GET /schedules/collaborator/:id]', () => {
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

  it('authorizes a lawyer to delete a blocked period from their own schedule', async () => {
    const { user: lawyerUser, collaborator: lawyer } = await fixture.registerLawyer()
    const [schedule] = await fixture.schedulesRepository.addMany([
      ScheduleFaker.fake({ collaboratorId: lawyer.id }),
    ])
    const blockedPeriod = await fixture.schedulesRepository.createBlockedPeriod({
      scheduleId: schedule.id,
      startsOn: '2026-11-01',
      endsOn: '2026-11-02',
      reason: 'Audiência externa',
    })

    const response = await request(fixture.app.getHttpServer())
      .delete(`/schedules/blocked-periods/${blockedPeriod.id}`)
      .set('Authorization', fixture.authenticateAs(lawyerUser))
      .expect(200)

    expect(response.body).toEqual({ success: true })

    const remainingPeriods =
      await fixture.schedulesRepository.findBlockedPeriodsByScheduleId(schedule.id)
    expect(remainingPeriods).toHaveLength(0)

    const checkDirect = await fixture.schedulesRepository.findBlockedPeriodById(
      blockedPeriod.id,
    )
    expect(checkDirect).toBeNull()
  })

  it('forbids another lawyer from deleting a blocked period from someone else schedule', async () => {
    const { collaborator: lawyer } = await fixture.registerLawyer()
    const { user: otherLawyerUser } = await fixture.registerLawyer()

    const [schedule] = await fixture.schedulesRepository.addMany([
      ScheduleFaker.fake({ collaboratorId: lawyer.id }),
    ])
    const blockedPeriod = await fixture.schedulesRepository.createBlockedPeriod({
      scheduleId: schedule.id,
      startsOn: '2026-11-01',
      endsOn: '2026-11-02',
      reason: 'Audiência externa',
    })

    await request(fixture.app.getHttpServer())
      .delete(`/schedules/blocked-periods/${blockedPeriod.id}`)
      .set('Authorization', fixture.authenticateAs(otherLawyerUser))
      .expect(403)

    const stillExists = await fixture.schedulesRepository.findBlockedPeriodById(
      blockedPeriod.id,
    )
    expect(stillExists).not.toBeNull()
  })

  it('returns 404 when attempting to delete a non-existent blocked period', async () => {
    const { user: lawyerUser } = await fixture.registerLawyer()

    await request(fixture.app.getHttpServer())
      .delete('/schedules/blocked-periods/00000000-0000-4000-8000-000000000999')
      .set('Authorization', fixture.authenticateAs(lawyerUser))
      .expect(404)
  })
})
