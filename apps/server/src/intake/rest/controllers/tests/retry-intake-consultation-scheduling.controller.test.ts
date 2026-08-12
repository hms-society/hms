import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import {
  ConsultationChannel,
  ConsultationModality,
} from '@hms/core/consultation/domain/structures'
import { IntakeConsultationSchedulingRequestedEvent } from '@hms/core/intake/domain/events'
import { IntakeStatus } from '@hms/core/intake/domain/structures'

import { IntakeModuleFixture } from '@/intake/fixtures/intake-module-fixture'
import { RetryIntakeConsultationSchedulingController } from '@/intake/rest/controllers/retry-intake-consultation-scheduling.controller'

describe('Retry Intake Consultation Scheduling Controller [POST /intakes/:intakeId/consultation-scheduling/retry]', () => {
  let fixture: IntakeModuleFixture

  beforeAll(async () => {
    fixture = await IntakeModuleFixture.register(
      RetryIntakeConsultationSchedulingController,
    )
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
    fixture.broker.publish.mockReset()
  })

  afterAll(async () => fixture.close())

  it('requests consultation scheduling again after a definitive failure', async () => {
    const intake = await fixture.registerIntake({
      status: IntakeStatus.ConsultationSchedulingFailed,
    })

    const response = await request(fixture.app.getHttpServer())
      .post(`/intakes/${intake.id}/consultation-scheduling/retry`)
      .send({
        assignedLawyerId: 'b4a55c12-1fca-4e17-810f-28128f046553',
        startsAt: '2026-08-13T13:00:00.000Z',
        modality: ConsultationModality.Virtual,
        channel: ConsultationChannel.GoogleMeet,
      })
      .expect(201)

    expect(response.body.status).toBe(IntakeStatus.ConsultationScheduling)
    expect(response.body.updatedBy).toBe(fixture.authUser.id)
    expect(fixture.broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: IntakeConsultationSchedulingRequestedEvent._NAME,
      }),
    )
  })

  it('rejects retrying consultation scheduling before a definitive failure', async () => {
    const intake = await fixture.registerIntake({
      status: IntakeStatus.ConsultationScheduling,
    })

    await request(fixture.app.getHttpServer())
      .post(`/intakes/${intake.id}/consultation-scheduling/retry`)
      .send({
        assignedLawyerId: 'b4a55c12-1fca-4e17-810f-28128f046553',
        startsAt: '2026-08-13T13:00:00.000Z',
        modality: ConsultationModality.InPerson,
      })
      .expect(409)
  })
})
