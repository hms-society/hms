import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { ListConsultationDocumentsController } from '@/consultation/rest/controllers'

describe('List Consultation Documents Controller [GET /consultations/:consultationId/documents]', () => {
  let fixture: ConsultationModuleFixture

  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(
      ListConsultationDocumentsController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('lists package documents and their version history', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )
    const document = await fixture.seedDocument(consultation.id)
    const version = await fixture.seedDocumentVersion(document.id, collaborator.id)

    const response = await request(fixture.app.getHttpServer())
      .get(`/consultations/${consultation.id}/documents`)
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)

    expect(response.body).toEqual([
      expect.objectContaining({
        id: document.id,
        title: document.title,
        versions: [
          expect.objectContaining({
            id: version.id,
            versionNumber: 1,
            status: 'in_review',
            pendingMarkersCount: 0,
          }),
        ],
      }),
    ])
    expect(response.body[0].versions[0]).not.toHaveProperty('content')
  })
})
