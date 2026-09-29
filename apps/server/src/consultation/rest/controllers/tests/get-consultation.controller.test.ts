import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { GetConsultationController } from '@/consultation/rest/controllers'

describe('Get Consultation Controller [GET /consultations/:consultationId]', () => {
  let fixture: ConsultationModuleFixture

  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(GetConsultationController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('rejects unauthenticated requests', async () => {
    await request(fixture.app.getHttpServer())
      .get('/consultations/a4337a86-6835-4ca9-95b5-9259609d8cf6')
      .expect(401)
  })

  it('returns the consultation and its available context', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )

    const response = await request(fixture.app.getHttpServer())
      .get(`/consultations/${consultation.id}`)
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)

    expect(response.body).toMatchObject({
      id: consultation.id,
      clientId: consultation.clientId,
      intakeId: consultation.intakeId,
      client: {
        id: consultation.clientId,
        name: 'Cliente de teste',
      },
      intake: {
        id: consultation.intakeId,
        clientId: consultation.clientId,
      },
      responsible: {
        collaboratorId: collaborator.id,
        professionalName: 'Advogado de teste',
      },
      assignedLawyer: {
        collaboratorId: collaborator.id,
        professionalName: 'Advogado de teste',
      },
    })
  })

  it('returns not found for an unknown consultation', async () => {
    const { user } = await fixture.registerAssociatedCollaborator()

    await request(fixture.app.getHttpServer())
      .get('/consultations/a4337a86-6835-4ca9-95b5-9259609d8cf6')
      .set('Authorization', fixture.authenticateAs(user))
      .expect(404)
  })
})
