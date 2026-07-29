import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IntakeFaker } from '@hms/core/intake/domain/entities/fakers'
import { RegisterIntakesController } from '@/intake/rest/controllers/register-intake.controller'
import { IntakeModuleFixture } from '@/intake/fixtures/intake-module-fixture'

describe('Register Intakes Controller [POST /intakes]', () => {
  let fixture: IntakeModuleFixture

  beforeAll(async () => {
    fixture = await IntakeModuleFixture.register(RegisterIntakesController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('registers an intake', async () => {
    const draft = IntakeFaker.fake()
    const response = await request(fixture.app.getHttpServer())
      .post('/intakes')
      .send({
        decision: 'schedule_consultation',
        clientId: draft.clientId,
        responsibleId: draft.responsibleId,
        createdBy: draft.createdBy,
        updatedBy: draft.updatedBy,
        origin: draft.origin,
        contactChannel: draft.contactChannel,
        legalAreaId: draft.legalAreaId,
        legalTopicId: draft.legalTopicId,
        urgency: draft.urgency,
        demandNotes: draft.demandNotes,
      })
      .expect(201)

    expect(response.body.id).toEqual(expect.any(String))
    expect(response.body.sequenceNumber).toBe(1)
    expect(response.body.status).toBe('consultation_scheduled')
  })

  it('registers an intake without scheduling', async () => {
    const draft = IntakeFaker.fake()
    const response = await request(fixture.app.getHttpServer())
      .post('/intakes')
      .send({
        decision: 'register_intake',
        clientId: draft.clientId,
        responsibleId: draft.responsibleId,
        createdBy: draft.createdBy,
        updatedBy: draft.updatedBy,
        origin: draft.origin,
        contactChannel: draft.contactChannel,
        legalAreaId: draft.legalAreaId,
        legalTopicId: draft.legalTopicId,
        urgency: draft.urgency,
        demandNotes: draft.demandNotes,
      })
      .expect(201)

    expect(response.body.status).toBe('registered')
  })
})
