import { ConsultationCreatedEvent } from '@hms/core/consultation/domain/events'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { IntakeModuleFixture } from '@/intake/fixtures/intake-module-fixture'
import { InngestFixture } from '@/shared/messaging/inngest/fixtures/inngest-fixture'
import { CompleteIntakeConsultationSchedulingJob } from '../complete-intake-consultation-scheduling-job'

const REQUESTED_BY = '79341eda-d65c-497c-a5bf-94c392031214'
const CONSULTATION_ID = 'f7aab3e3-5474-4fdb-8d45-8508e44b7029'

describe('CompleteIntakeConsultationSchedulingJob', () => {
  let intakeFixture: IntakeModuleFixture
  let inngestFixture: InngestFixture

  beforeAll(async () => {
    intakeFixture = await IntakeModuleFixture.register()
    try {
      inngestFixture = await InngestFixture.register({
        createFunctions(client) {
          return [
            new CompleteIntakeConsultationSchedulingJob(
              client,
              intakeFixture.intakesRepository,
            ).function,
          ]
        },
      })
    } catch (error) {
      await intakeFixture.close()
      throw error
    }
  })

  beforeEach(async () => {
    await intakeFixture.resetDatabase()
  })

  afterAll(async () => {
    try {
      await inngestFixture?.close()
    } finally {
      await intakeFixture?.close()
    }
  })

  it('consumes a consultation-created event through Inngest and persists the scheduled status', async () => {
    const intake = await intakeFixture.registerIntake({
      status: IntakeStatus.ConsultationScheduling,
    })

    await inngestFixture.client.send({
      name: ConsultationCreatedEvent._NAME,
      data: {
        consultationId: CONSULTATION_ID,
        intakeId: intake.id,
        requestedBy: REQUESTED_BY,
        occurredAt: new Date().toISOString(),
      },
    })

    await expect
      .poll(async () => intakeFixture.intakesRepository.findById(intake.id), {
        timeout: 20_000,
      })
      .toMatchObject({
        status: IntakeStatus.ConsultationScheduled,
        updatedBy: REQUESTED_BY,
        version: intake.version + 1,
      })
  }, 30_000)
})
