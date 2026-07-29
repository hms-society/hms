import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { ListClientIntakesController } from '@/intake/rest/controllers/list-client-intakes.controller'
import { IntakeModuleFixture } from '@/intake/fixtures/intake-module-fixture'

describe('List Client Intakes Controller [GET /intakes/clients/:clientId]', () => {
  let fixture: IntakeModuleFixture

  beforeAll(async () => {
    fixture = await IntakeModuleFixture.register(ListClientIntakesController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('lists client intakes', async () => {
    const clientId = randomUUID()
    await fixture.seedIntakes([{ clientId }, { clientId }])

    const response = await request(fixture.app.getHttpServer())
      .get(`/intakes/clients/${clientId}`)
      .expect(200)

    expect(response.body).toHaveLength(2)
    expect(response.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ clientId })]),
    )
  })
})
