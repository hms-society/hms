import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CloseIntakeWithoutContractController } from '@/intake/rest/controllers/close-intake-without-contract.controller'
import { IntakeModuleFixture } from '@/intake/fixtures/intake-module-fixture'

describe('Close Intake Without Contract Controller [POST /intakes/:intakeId/close]', () => {
  let fixture: IntakeModuleFixture

  beforeAll(async () => {
    fixture = await IntakeModuleFixture.register(CloseIntakeWithoutContractController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('closes an intake without a contract', async () => {
    const intake = await fixture.registerIntake()

    const response = await request(fixture.app.getHttpServer())
      .post(`/intakes/${intake.id}/close`)
      .send({
        expectedVersion: intake.version,
        closureReason: 'out_of_scope',
        updatedBy: intake.updatedBy,
      })
      .expect(201)

    expect(response.body.status).toBe('closed_without_contract')
    expect(response.body.closureReason).toBe('out_of_scope')
    expect(response.body.closedAt).toEqual(expect.any(String))
  })
})
