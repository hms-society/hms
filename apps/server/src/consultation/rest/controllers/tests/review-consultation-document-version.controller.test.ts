import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { ConsultationSeeder } from '@/consultation/database/consultation-seeder'
import { IntakeSeeder } from '@/intake/database/intake-seeder'
import { SchedulingSeeder } from '@/scheduling/database/scheduling-seeder'
import { DocumentProductionSeeder } from '@/document-production/database/document-production-seeder'
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

  it('records the privileged reviewer approval', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const { collaborator: author } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )
    const document = await fixture.seedDocument(consultation.id)
    const version = await fixture.seedDocumentVersion(document.id, author.id)

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
    const { collaborator: author } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )
    const document = await fixture.seedDocument(consultation.id)
    const version = await fixture.seedDocumentVersion(document.id, author.id)

    await request(fixture.app.getHttpServer())
      .patch(
        `/consultations/${consultation.id}/documents/${document.id}/versions/${version.id}/review`,
      )
      .set('Authorization', fixture.authenticateAs(user))
      .send({ decision: 'rejected' })
      .expect(400)
  })

  it('blocks approval with pending markers and preserves the version for rejection', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const { collaborator: author } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )
    const document = await fixture.seedDocument(consultation.id)
    const version = await fixture.seedDocumentVersion(document.id, author.id, {
      pendingMarkers: [{ marker: '{cliente_cpf}' }],
    })
    const route = `/consultations/${consultation.id}/documents/${document.id}/versions/${version.id}/review`
    const response = await request(fixture.app.getHttpServer())
      .patch(route)
      .set('Authorization', fixture.authenticateAs(user))
      .send({ decision: 'approved' })
      .expect(409)
    expect(response.body.message).toContain('Resolva as pendências')
    expect(await fixture.documentVersionsRepository.findById(version.id)).toMatchObject({
      status: 'in_review',
      pendingMarkers: [{ marker: '{cliente_cpf}' }],
    })
    await request(fixture.app.getHttpServer())
      .patch(route)
      .set('Authorization', fixture.authenticateAs(user))
      .send({ decision: 'rejected', rejectionReason: 'CPF pendente.' })
      .expect(200)
  })

  it('keeps the pending-data seed example in review and blocks its approval', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const { collaborator: author } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )
    if (!consultation.legalAreaId || !consultation.legalTopicId) {
      throw new Error('The seeded consultation requires a legal context')
    }
    const intakeSeed = await fixture.app.get(IntakeSeeder).run({
      clientIds: [consultation.clientId],
      documentProductionClientId: consultation.clientId,
      responsibleId: collaborator.id,
      actorId: user.id,
      legalAreaId: consultation.legalAreaId,
      legalTopicId: consultation.legalTopicId,
    })
    const schedulingSeed = await fixture.app.get(SchedulingSeeder).run({
      intakeId: intakeSeed.documentProductionIntake.id,
      pendingMarkersIntakeId: intakeSeed.pendingMarkersIntake.id,
      clientId: consultation.clientId,
      assignedLawyerId: collaborator.id,
    })
    if (!schedulingSeed.pendingMarkersAppointment) {
      throw new Error('The pending-data appointment must exist')
    }
    const consultationSeed = await fixture.app.get(ConsultationSeeder).run({
      hasPendingDocumentData: true,
      intakeId: intakeSeed.pendingMarkersIntake.id,
      appointmentId: schedulingSeed.pendingMarkersAppointment.id,
      clientId: consultation.clientId,
      assignedLawyerId: collaborator.id,
      legalAreaId: consultation.legalAreaId,
      legalTopicId: consultation.legalTopicId,
    })
    const pendingConsultation = consultationSeed.consultation
    expect(pendingConsultation.id).toBe('00000000-0000-4000-8000-000000000102')
    expect(pendingConsultation.notes).toContain('não informou')
    expect(pendingConsultation.intakeId).not.toBe(consultation.intakeId)
    const seeded = await fixture.app.get(DocumentProductionSeeder).run({
      hasPendingDocumentData: true,
      consultationId: pendingConsultation.id,
      requestedByCollaboratorId: author.id,
      legalAreas: [{ id: consultation.legalAreaId, name: 'Cível' }],
      legalTopics: [
        {
          id: consultation.legalTopicId,
          legalAreaId: consultation.legalAreaId,
          name: 'Contratos',
        },
      ],
    })
    const [document] = seeded.documents
    const [version] = seeded.versions
    expect(version).toMatchObject({
      status: 'in_review',
      pendingMarkers: [
        { marker: '{endereco_imovel}' },
        { marker: '{procurador_nome}' },
        { marker: '{procurador_oab}' },
      ],
    })
    expect(seeded.generations[0]).toMatchObject({
      status: 'completed',
      documentVersionId: version.id,
    })
    const response = await request(fixture.app.getHttpServer())
      .patch(
        `/consultations/${pendingConsultation.id}/documents/${document.id}/versions/${version.id}/review`,
      )
      .set('Authorization', fixture.authenticateAs(user))
      .send({ decision: 'approved' })
      .expect(409)
    expect(response.body.message).toContain('Resolva as pendências')
    expect(await fixture.documentVersionsRepository.findById(version.id)).toMatchObject({
      status: 'in_review',
      pendingMarkers: version.pendingMarkers,
    })
  })
})
