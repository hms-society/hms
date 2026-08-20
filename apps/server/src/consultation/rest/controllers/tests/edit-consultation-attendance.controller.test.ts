import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'
import { ConsultationStatus } from '@hms/core/consultation/domain/structures'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { EditConsultationAttendanceController } from '@/consultation/rest/controllers'

describe('Edit Consultation Attendance Controller [PATCH /consultations/:consultationId/attendance/edit]', () => {
  let fixture: ConsultationModuleFixture

  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(
      EditConsultationAttendanceController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('reopens a finalized attendance and clears its finalization marker', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({
        assignedLawyerId: collaborator.id,
        status: ConsultationStatus.Pending,
        attendanceFinalizedAt: new Date('2026-08-19T11:00:00.000Z'),
        attendanceFinalizedByCollaboratorId: collaborator.id,
      }),
    )

    const response = await request(fixture.app.getHttpServer())
      .patch(`/consultations/${consultation.id}/attendance/edit`)
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)

    expect(response.body.attendanceFinalizedAt).toBeUndefined()
    expect(response.body.attendanceFinalizedByCollaboratorId).toBeUndefined()

    const updated = await fixture.consultationsRepository.findById(consultation.id)
    expect(updated?.attendanceFinalizedAt).toBeUndefined()
    expect(updated?.attendanceFinalizedByCollaboratorId).toBeUndefined()
  })

  it('rejects unauthenticated requests', async () => {
    await request(fixture.app.getHttpServer())
      .patch('/consultations/a4337a86-6835-4ca9-95b5-9259609d8cf6/attendance/edit')
      .expect(401)
  })
})
