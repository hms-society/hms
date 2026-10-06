import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { randomUUID } from 'node:crypto'
import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'
import { ConsultationStatus } from '@hms/core/consultation/domain/structures'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { CompleteConsultationController } from '@/consultation/rest/controllers'

describe('Complete Consultation Controller [PATCH /consultations/:consultationId/complete]', () => {
  let fixture: ConsultationModuleFixture
  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(CompleteConsultationController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('completes a consultation with finalized attendance and confirmed documents', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({
        assignedLawyerId: collaborator.id,
        status: ConsultationStatus.Pending,
        attendanceFinalizedAt: new Date(),
        attendanceFinalizedByCollaboratorId: collaborator.id,
      }),
    )
    const documentPackage = await fixture.documentPackagesRepository.add({
      id: randomUUID(),
      context: { type: 'consultation', consultationId: consultation.id },
    })
    await fixture.documentPackagesRepository.confirm(
      documentPackage.id,
      collaborator.id,
      new Date(),
    )

    const response = await request(fixture.app.getHttpServer())
      .patch(`/consultations/${consultation.id}/complete`)
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)
    expect(response.body.status).toBe(ConsultationStatus.Completed)
    expect(
      (await fixture.consultationsRepository.findById(consultation.id))?.status,
    ).toBe(ConsultationStatus.Completed)
  })

  it('requires authentication', async () => {
    await request(fixture.app.getHttpServer())
      .patch('/consultations/a4337a86-6835-4ca9-95b5-9259609d8cf6/complete')
      .expect(401)
  })
})
