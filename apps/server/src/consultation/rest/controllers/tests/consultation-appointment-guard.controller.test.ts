import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import {
  CompleteConsultationController,
  FinalizeConsultationAttendanceController,
} from '@/consultation/rest/controllers'

describe('Consultation Appointment Guard [PATCH /consultations/:id/{complete,attendance/finalize}]', () => {
  let fixture: ConsultationModuleFixture

  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register([
      CompleteConsultationController,
      FinalizeConsultationAttendanceController,
    ])
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('rejects completion after cancellation without publishing or creating outbox state', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const seeded = await fixture.seedConsultationWithAppointment(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
      'cancelled',
    )

    await request(fixture.app.getHttpServer())
      .patch(`/consultations/${seeded.consultation.id}/complete`)
      .set('Authorization', fixture.authenticateAs(user))
      .expect(409)

    expect(fixture.broker.publish).not.toHaveBeenCalled()
    expect(await fixture.outboxRepository.listPending(50)).toHaveLength(0)
  })

  it('rejects attendance finalization after cancellation', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const seeded = await fixture.seedConsultationWithAppointment(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
      'cancelled',
    )

    await request(fixture.app.getHttpServer())
      .patch(`/consultations/${seeded.consultation.id}/attendance/finalize`)
      .set('Authorization', fixture.authenticateAs(user))
      .send({
        legalAreaId: seeded.consultation.legalAreaId,
        legalTopicId: seeded.consultation.legalTopicId,
        modality: 'in_person',
        primaryLegalQuestion: 'Questão',
        guidanceProvided: 'Orientação',
        viability: 'Viável',
        decision: 'Prosseguir para contratação',
        answers: [],
        relevantFacts: [],
        potentialLegalRequests: [],
      })
      .expect(409)

    expect(fixture.broker.publish).not.toHaveBeenCalled()
    expect(await fixture.outboxRepository.listPending(50)).toHaveLength(0)
  })
})
