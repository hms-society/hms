import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { GenerateConsultationDocumentsController } from '@/consultation/rest/controllers'

describe('Generate Consultation Documents Controller [POST /consultations/:consultationId/document-generations/batch]', () => {
  let fixture: ConsultationModuleFixture

  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(
      GenerateConsultationDocumentsController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('requests every document that has not been generated', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )
    const document = await fixture.seedDocument(consultation.id)

    const response = await request(fixture.app.getHttpServer())
      .post(`/consultations/${consultation.id}/document-generations/batch`)
      .set('Authorization', fixture.authenticateAs(user))
      .expect(202)

    expect(response.body).toEqual([expect.objectContaining({ documentId: document.id })])
    expect(fixture.broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'document-production/document-batch.generation-requested',
        payload: expect.objectContaining({
          source: expect.objectContaining({
            data: expect.objectContaining({
              client: expect.objectContaining({
                id: consultation.clientId,
                name: 'Cliente de teste',
                taxId: { type: 'cpf', value: '52998224725' },
              }),
              legalContext: {
                area: expect.objectContaining({
                  id: consultation.legalAreaId,
                  name: 'Direito Civil',
                }),
                topic: expect.objectContaining({
                  id: consultation.legalTopicId,
                  name: 'Locação residencial',
                }),
              },
            }),
          }),
        }),
      }),
    )
  })
})
