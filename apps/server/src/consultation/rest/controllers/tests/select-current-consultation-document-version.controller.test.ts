import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { SelectCurrentConsultationDocumentVersionController } from '@/consultation/rest/controllers'

describe('Select Current Consultation Document Version Controller [PATCH /consultations/:consultationId/documents/:documentId/versions/:documentVersionId/current]', () => {
  let fixture: ConsultationModuleFixture

  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(
      SelectCurrentConsultationDocumentVersionController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('selects an approved version as current', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )
    const document = await fixture.seedDocument(consultation.id)
    const version = await fixture.seedDocumentVersion(document.id, collaborator.id)
    const approved = await fixture.documentVersionsRepository.review(
      version.id,
      'approved',
      collaborator.id,
      new Date('2026-08-12T19:00:00.000Z'),
    )
    if (!approved) throw new Error('Test version was not approved')

    const response = await request(fixture.app.getHttpServer())
      .patch(
        `/consultations/${consultation.id}/documents/${document.id}/versions/${version.id}/current`,
      )
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)

    expect(response.body).toMatchObject({
      id: document.id,
      currentVersionId: version.id,
    })
    await expect(
      fixture.documentsRepository.findById(document.id),
    ).resolves.toMatchObject({
      currentVersionId: version.id,
    })
  })
})
