import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { ReviewConsultationDocumentVersionController } from '@/consultation/rest/controllers'

describe('Review Consultation Document Version Controller [PATCH /consultations/:consultationId/documents/:documentId/versions/:documentVersionId/review]', () => {
  let fixture: ConsultationModuleFixture

  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(
      ReviewConsultationDocumentVersionController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('records the assigned lawyer approval', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )
    const document = await fixture.seedDocument(consultation.id)
    const version = await fixture.seedDocumentVersion(document.id, collaborator.id)

    const response = await request(fixture.app.getHttpServer())
      .patch(
        `/consultations/${consultation.id}/documents/${document.id}/versions/${version.id}/review`,
      )
      .set('Authorization', fixture.authenticateAs(user))
      .send({ decision: 'approved' })
      .expect(200)

    expect(response.body).toMatchObject({
      id: version.id,
      status: 'approved',
      reviewedByCollaboratorId: collaborator.id,
    })
  })

  it('requires a reason when rejecting a version', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )
    const document = await fixture.seedDocument(consultation.id)
    const version = await fixture.seedDocumentVersion(document.id, collaborator.id)

    await request(fixture.app.getHttpServer())
      .patch(
        `/consultations/${consultation.id}/documents/${document.id}/versions/${version.id}/review`,
      )
      .set('Authorization', fixture.authenticateAs(user))
      .send({ decision: 'rejected' })
      .expect(400)
  })
})
