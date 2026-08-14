import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { CancelConsultationDocumentGenerationController } from '@/consultation/rest/controllers'

describe('Cancel Consultation Document Generation Controller [POST /consultations/:consultationId/documents/:documentId/generations/cancel]', () => {
  let fixture: ConsultationModuleFixture

  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(
      CancelConsultationDocumentGenerationController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('cancels an active generation and publishes its cancellation event', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )
    const document = await fixture.seedDocument(consultation.id)
    const generation = await fixture.seedDocumentGeneration(document.id, collaborator.id)

    await request(fixture.app.getHttpServer())
      .post(
        `/consultations/${consultation.id}/documents/${document.id}/generations/cancel`,
      )
      .set('Authorization', fixture.authenticateAs(user))
      .expect(204)

    const persistedGeneration = await fixture.documentGenerationsRepository.findById(
      generation.id,
    )
    expect(persistedGeneration).toEqual(
      expect.objectContaining({ status: 'cancelled', cancelledAt: expect.any(Date) }),
    )
    expect(fixture.broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'document-production/document.generation-cancelled',
        payload: expect.objectContaining({ documentGenerationId: generation.id }),
      }),
    )
  })
})
