import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { SaveManualConsultationDocumentVersionController } from '@/consultation/rest/controllers'

describe('Save Manual Consultation Document Version Controller [POST /consultations/:consultationId/documents/:documentId/versions/:sourceDocumentVersionId/manual]', () => {
  let fixture: ConsultationModuleFixture

  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(
      SaveManualConsultationDocumentVersionController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('saves edited content as a new immutable version', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )
    const document = await fixture.seedDocument(consultation.id)
    const sourceVersion = await fixture.seedDocumentVersion(document.id, collaborator.id)
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Cliente: {cliente_nome}' }],
        },
      ],
    }

    const response = await request(fixture.app.getHttpServer())
      .post(
        `/consultations/${consultation.id}/documents/${document.id}/versions/${sourceVersion.id}/manual`,
      )
      .set('Authorization', fixture.authenticateAs(user))
      .send({ content })
      .expect(201)

    expect(response.body).toMatchObject({
      documentId: document.id,
      sourceDocumentVersionId: sourceVersion.id,
      versionNumber: 2,
      source: 'manual',
      status: 'in_review',
      content,
      pendingMarkers: [{ marker: '{cliente_nome}' }],
    })
  })
})
