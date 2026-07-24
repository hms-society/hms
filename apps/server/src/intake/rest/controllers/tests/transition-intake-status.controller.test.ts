import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { TransitionIntakeStatusController } from '@/intake/rest/controllers/transition-intake-status.controller'
import { IntakeModuleFixture } from '@/intake/fixtures/intake-module-fixture'

describe('Transition Intake Status Controller [PATCH /intakes/:intakeId/status]', () => {
  let fixture: IntakeModuleFixture

  beforeAll(async () => {
    fixture = await IntakeModuleFixture.register(TransitionIntakeStatusController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('transitions an intake status', async () => {
    const intake = await fixture.registerIntake()

    const response = await request(fixture.app.getHttpServer())
      .patch(`/intakes/${intake.id}/status`)
      .send({
        expectedVersion: intake.version,
        status: 'consultation_completed',
        updatedBy: intake.updatedBy,
      })
      .expect(200)

    expect(response.body.status).toBe('consultation_completed')
    expect(response.body.version).toBe(intake.version + 1)
  })
})
