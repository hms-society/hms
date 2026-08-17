import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { GetConsultationDocumentSelectionController } from '@/consultation/rest/controllers'

describe('Get Consultation Document Selection Controller [GET /consultations/:consultationId/documents/selection]', () => {
  let fixture: ConsultationModuleFixture

  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(
      GetConsultationDocumentSelectionController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('rejects unauthenticated requests', async () => {
    await request(fixture.app.getHttpServer())
      .get('/consultations/a4337a86-6835-4ca9-95b5-9259609d8cf6/documents/selection')
      .expect(401)
  })

  it('returns available models and the current package selection', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )
    await fixture.seedDocument(consultation.id)

    const response = await request(fixture.app.getHttpServer())
      .get(`/consultations/${consultation.id}/documents/selection`)
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)

    expect(response.body.options).toHaveLength(1)
    expect(response.body.options[0]).toMatchObject({
      name: 'Procuração',
      selected: true,
      hasVersion: false,
      status: 'available',
    })
    expect(response.body.selectedDocumentSpecificationIds).toEqual([
      response.body.options[0].documentSpecificationId,
    ])
  })
})
