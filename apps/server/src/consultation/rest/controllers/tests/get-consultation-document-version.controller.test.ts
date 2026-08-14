import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { GetConsultationDocumentVersionController } from '@/consultation/rest/controllers'

describe('Get Consultation Document Version Controller [GET /consultations/:consultationId/documents/:documentId/versions/:documentVersionId]', () => {
  let fixture: ConsultationModuleFixture

  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(
      GetConsultationDocumentVersionController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('returns the immutable version with its Tiptap content', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )
    const document = await fixture.seedDocument(consultation.id)
    const version = await fixture.seedDocumentVersion(document.id, collaborator.id)

    const response = await request(fixture.app.getHttpServer())
      .get(
        `/consultations/${consultation.id}/documents/${document.id}/versions/${version.id}`,
      )
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)

    expect(response.body).toMatchObject({
      id: version.id,
      documentId: document.id,
      content: version.content,
      status: 'in_review',
    })
  })
})
