import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { UpdateIntakeController } from '@/intake/rest/controllers/update-intake.controller'
import { IntakeModuleFixture } from '@/intake/fixtures/intake-module-fixture'

describe('Update Intake Controller [PATCH /intakes/:intakeId]', () => {
  let fixture: IntakeModuleFixture

  beforeAll(async () => {
    fixture = await IntakeModuleFixture.register(UpdateIntakeController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('updates editable intake fields', async () => {
    const intake = await fixture.registerIntake()

    const payload = {
      expectedVersion: intake.version,
      updatedBy: intake.updatedBy,
      responsibleId: intake.responsibleId,
      origin: 'referral',
      contactChannel: 'email',
      legalAreaId: intake.legalAreaId,
      legalTopicId: intake.legalTopicId,
      urgency: 'urgent',
      demandNotes: 'Demanda revisada',
    }
    const response = await request(fixture.app.getHttpServer())
      .patch(`/intakes/${intake.id}`)
      .send(payload)

      .expect(200)

    expect(response.body.origin).toBe('referral')
    expect(response.body.contactChannel).toBe('email')
    expect(response.body.urgency).toBe('urgent')
    expect(response.body.demandNotes).toBe('Demanda revisada')
    expect(response.body.version).toBe(intake.version + 1)
  })
})
