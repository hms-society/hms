import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { GenerateConsultationDocumentController } from '@/consultation/rest/controllers'

describe('Generate Consultation Document Controller [POST /consultations/:consultationId/documents/:documentId/generations]', () => {
  let fixture: ConsultationModuleFixture

  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(
      GenerateConsultationDocumentController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('rejects unauthenticated requests', async () => {
    await request(fixture.app.getHttpServer())
      .post(
        '/consultations/a4337a86-6835-4ca9-95b5-9259609d8cf6/documents/a7b4f7c1-98e8-4f20-a5a6-30d35ee694d2/generations',
      )
      .expect(401)
  })

  it('requests generation for a document in the associated consultation', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )
    const document = await fixture.seedDocument(consultation.id)

    const response = await request(fixture.app.getHttpServer())
      .post(`/consultations/${consultation.id}/documents/${document.id}/generations`)
      .set('Authorization', fixture.authenticateAs(user))
      .send({ instructions: 'Atualizar a qualificação das partes.' })
      .expect(202)

    expect(response.body).toMatchObject({ documentId: document.id })
    expect(response.body.documentGenerationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
    expect(fixture.broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'document-production/document.generation-requested',
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
          instructions: 'Atualizar a qualificação das partes.',
        }),
      }),
    )
  })

  it('requests generation without a body for the initial document production', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )
    const document = await fixture.seedDocument(consultation.id)

    const response = await request(fixture.app.getHttpServer())
      .post(`/consultations/${consultation.id}/documents/${document.id}/generations`)
      .set('Authorization', fixture.authenticateAs(user))
      .expect(202)

    expect(response.body).toMatchObject({ documentId: document.id })
    expect(fixture.broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'document-production/document.generation-requested',
        payload: expect.objectContaining({
          documentId: document.id,
        }),
      }),
    )
  })
})
