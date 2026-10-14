import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'
import {
  ConsultationDecision,
  ConsultationStatus,
  ConsultationViability,
} from '@hms/core/consultation/domain/structures'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { FinalizeConsultationAttendanceController } from '@/consultation/rest/controllers'

describe('Finalize Consultation Attendance Controller [PATCH /consultations/:consultationId/attendance/finalize]', () => {
  let fixture: ConsultationModuleFixture
  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(
      FinalizeConsultationAttendanceController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('persists the completed attendance record', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const { consultation } = await fixture.seedConsultationWithAppointment(
      ConsultationFaker.fake({
        assignedLawyerId: collaborator.id,
        status: ConsultationStatus.Pending,
      }),
    )
    const response = await request(fixture.app.getHttpServer())
      .patch(`/consultations/${consultation.id}/attendance/finalize`)
      .set('Authorization', fixture.authenticateAs(user))
      .send({
        legalAreaId: consultation.legalAreaId,
        legalTopicId: consultation.legalTopicId,
        modality: 'in_person',
        primaryLegalQuestion: 'Qual é o prazo?',
        guidanceProvided: 'Orientação registrada.',
        viability: ConsultationViability.Viable,
        decision: ConsultationDecision.NewConsultation,
      })
      .expect(200)
    expect(response.body.attendanceFinalizedByCollaboratorId).toBe(collaborator.id)
    const saved = await fixture.consultationsRepository.findById(consultation.id)
    expect(saved?.attendanceFinalizedAt).toBeInstanceOf(Date)
    expect(saved?.primaryLegalQuestion).toBe('Qual é o prazo?')
  })

  it('requires authentication before validating the attendance request', async () => {
    await request(fixture.app.getHttpServer())
      .patch('/consultations/a4337a86-6835-4ca9-95b5-9259609d8cf6/attendance/finalize')
      .send({ answers: {} })
      .expect(401)
  })

  it('rejects an incomplete attendance body', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({
        assignedLawyerId: collaborator.id,
      }),
    )
    await request(fixture.app.getHttpServer())
      .patch(`/consultations/${consultation.id}/attendance/finalize`)
      .set('Authorization', fixture.authenticateAs(user))
      .send({})
      .expect(400)
  })
})
