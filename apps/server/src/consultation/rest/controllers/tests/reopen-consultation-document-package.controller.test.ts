import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { randomUUID } from 'node:crypto'
import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { ReopenConsultationDocumentPackageController } from '@/consultation/rest/controllers'

describe('Reopen Consultation Document Package Controller [PATCH /consultations/:consultationId/documents/package/reopen]', () => {
  let fixture: ConsultationModuleFixture
  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(
      ReopenConsultationDocumentPackageController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('reopens a confirmed package in PostgreSQL', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({
        assignedLawyerId: collaborator.id,
        attendanceFinalizedAt: new Date(),
        attendanceFinalizedByCollaboratorId: collaborator.id,
      }),
    )
    const documentPackage = await fixture.documentPackagesRepository.add({
      id: randomUUID(),
      context: { type: 'consultation', consultationId: consultation.id },
    })
    await fixture.documentPackagesRepository.confirm(
      documentPackage.id,
      collaborator.id,
      new Date(),
    )
    await request(fixture.app.getHttpServer())
      .patch(`/consultations/${consultation.id}/documents/package/reopen`)
      .set('Authorization', fixture.authenticateAs(user))
      .expect(204)
    const saved = await fixture.documentPackagesRepository.findByContext({
      type: 'consultation',
      consultationId: consultation.id,
    })
    expect(saved?.confirmedAt).toBeUndefined()
  })

  it('rejects a package that was never confirmed', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({
        assignedLawyerId: collaborator.id,
      }),
    )
    await request(fixture.app.getHttpServer())
      .patch(`/consultations/${consultation.id}/documents/package/reopen`)
      .set('Authorization', fixture.authenticateAs(user))
      .expect(400)
  })
})
