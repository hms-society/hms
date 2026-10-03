import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { ConfirmConsultationDocumentPackageController } from '@/consultation/rest/controllers'

describe('Confirm Consultation Document Package Controller [PATCH /consultations/:consultationId/documents/package/confirm]', () => {
  let fixture: ConsultationModuleFixture
  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(
      ConfirmConsultationDocumentPackageController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('confirms a package after its document has a reviewed version', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({
        assignedLawyerId: collaborator.id,
        attendanceFinalizedAt: new Date(),
        attendanceFinalizedByCollaboratorId: collaborator.id,
      }),
    )
    const document = await fixture.seedDocument(consultation.id)
    await fixture.seedDocumentVersion(document.id, collaborator.id, {
      status: 'approved',
      reviewedByCollaboratorId: collaborator.id,
      reviewedAt: new Date(),
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/consultations/${consultation.id}/documents/package/confirm`)
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)
    expect(response.body.confirmedByCollaboratorId).toBe(collaborator.id)
    const saved = await fixture.documentPackagesRepository.findByContext({
      type: 'consultation',
      consultationId: consultation.id,
    })
    expect(saved?.confirmedAt).toBeInstanceOf(Date)
  })

  it('rejects confirmation before attendance is finalized', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({
        assignedLawyerId: collaborator.id,
      }),
    )
    await request(fixture.app.getHttpServer())
      .patch(`/consultations/${consultation.id}/documents/package/confirm`)
      .set('Authorization', fixture.authenticateAs(user))
      .expect(400)
  })
})
