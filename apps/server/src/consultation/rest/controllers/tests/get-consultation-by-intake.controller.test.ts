import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { GetConsultationByIntakeController } from '@/consultation/rest/controllers'

describe('Get Consultation By Intake Controller [GET /consultations/by-intake/:intakeId]', () => {
  let fixture: ConsultationModuleFixture

  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(GetConsultationByIntakeController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('returns the consultation linked to the intake', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )

    const response = await request(fixture.app.getHttpServer())
      .get(`/consultations/by-intake/${consultation.intakeId}`)
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)

    expect(response.body).toMatchObject({
      id: consultation.id,
      intakeId: consultation.intakeId,
    })
  })

  it('returns not found when the intake has no consultation', async () => {
    const { user } = await fixture.registerAssociatedCollaborator()

    await request(fixture.app.getHttpServer())
      .get('/consultations/by-intake/a4337a86-6835-4ca9-95b5-9259609d8cf6')
      .set('Authorization', fixture.authenticateAs(user))
      .expect(404)
  })
})
