import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { GetIntakesController } from '@/intake/rest/controllers/get-intake.controller'
import { IntakeModuleFixture } from '@/intake/fixtures/intake-module-fixture'

describe('Get Intakes Controller [GET /intakes/:intakeId]', () => {
  let fixture: IntakeModuleFixture

  beforeAll(async () => {
    fixture = await IntakeModuleFixture.register(GetIntakesController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('gets an intake', async () => {
    const intake = await fixture.registerIntake()

    const response = await request(fixture.app.getHttpServer())
      .get(`/intakes/${intake.id}`)
      .set('Authorization', 'Bearer fixture-access-token')
      .expect(200)

    expect(response.body.id).toBe(intake.id)
  })

  it('returns a standardized error when the intake does not exist', async () => {
    const intakeId = '00000000-0000-0000-0000-000000000001'

    const response = await request(fixture.app.getHttpServer())
      .get(`/intakes/${intakeId}`)
      .set('Authorization', 'Bearer fixture-access-token')
      .expect(404)

    expect(response.body).toEqual({
      statusCode: 404,
      title: 'Erro de Não Encontrado',
      message: 'Intake não encontrado.',
      timestamp: expect.any(String),
      path: `/intakes/${intakeId}`,
    })
  })
})
