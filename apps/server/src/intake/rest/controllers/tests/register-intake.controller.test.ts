import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IntakeFaker } from '@hms/core/intake/domain/entities/fakers'
import { IntakeDecision, IntakeStatus } from '@hms/core/intake/domain/structures'
import {
  ConsultationChannel,
  ConsultationModality,
} from '@hms/core/consultation/domain/structures'
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
        decision: IntakeDecision.ScheduleConsultation,
        assignedLawyerId: draft.responsibleId,
        startsAt: '2026-08-13T13:00:00.000Z',
        modality: ConsultationModality.Virtual,
        channel: ConsultationChannel.WhatsappVideo,
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
    expect(response.body.status).toBe(IntakeStatus.ConsultationScheduling)
    expect(response.body.createdBy).toBe(fixture.authUser.id)
    expect(response.body.updatedBy).toBe(fixture.authUser.id)
  })

  it('registers an intake without scheduling', async () => {
    const draft = IntakeFaker.fake()
    const response = await request(fixture.app.getHttpServer())
      .post('/intakes')
      .send({
        decision: IntakeDecision.RegisterIntake,
        clientId: draft.clientId,
        responsibleId: draft.responsibleId,
        origin: draft.origin,
        contactChannel: draft.contactChannel,
        urgency: draft.urgency,
        demandNotes: draft.demandNotes,
      })
      .expect(201)

    expect(response.body.status).toBe('registered')
    expect(response.body.legalAreaId).toBeUndefined()
    expect(response.body.legalTopicId).toBeUndefined()
  })

  it('rejects consultation scheduling without an assigned lawyer', async () => {
    const draft = IntakeFaker.fake()

    await request(fixture.app.getHttpServer())
      .post('/intakes')
      .send({
        decision: IntakeDecision.ScheduleConsultation,
        startsAt: '2026-08-13T13:00:00.000Z',
        modality: ConsultationModality.Virtual,
        channel: ConsultationChannel.WhatsappVideo,
        clientId: draft.clientId,
        responsibleId: draft.responsibleId,
        origin: draft.origin,
        contactChannel: draft.contactChannel,
        legalAreaId: draft.legalAreaId,
        legalTopicId: draft.legalTopicId,
        urgency: draft.urgency,
        demandNotes: draft.demandNotes,
      })
      .expect(400)

    const intakes = await fixture.intakeListRepository.list({})

    expect(intakes.total).toBe(0)
  })

  it('requires a closure reason when closing an intake without a contract', async () => {
    const draft = IntakeFaker.fake()

    await request(fixture.app.getHttpServer())
      .post('/intakes')
      .send({
        decision: IntakeDecision.CloseWithoutContract,
        clientId: draft.clientId,
        responsibleId: draft.responsibleId,
        origin: draft.origin,
        contactChannel: draft.contactChannel,
        legalAreaId: draft.legalAreaId,
        legalTopicId: draft.legalTopicId,
        urgency: draft.urgency,
        demandNotes: draft.demandNotes,
      })
      .expect(400)

    const intakes = await fixture.intakeListRepository.list({})

    expect(intakes.total).toBe(0)
  })
})
