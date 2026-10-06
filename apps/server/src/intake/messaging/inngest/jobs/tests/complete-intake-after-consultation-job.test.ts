import { ConsultationCompletedEvent } from '@hms/core/consultation/domain/events'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { IntakeModuleFixture } from '@/intake/fixtures/intake-module-fixture'
import { InngestFixture } from '@/shared/messaging/inngest/fixtures/inngest-fixture'
import { CompleteIntakeAfterConsultationJob } from '../complete-intake-after-consultation-job'

const COMPLETED_BY = '79341eda-d65c-497c-a5bf-94c392031214'
const CONSULTATION_ID = 'f7aab3e3-5474-4fdb-8d45-8508e44b7029'

describe('CompleteIntakeAfterConsultationJob', () => {
  let intakeFixture: IntakeModuleFixture
  let inngestFixture: InngestFixture

  beforeAll(async () => {
    intakeFixture = await IntakeModuleFixture.register()
    try {
      inngestFixture = await InngestFixture.register({
        createFunctions(client) {
          return [
            new CompleteIntakeAfterConsultationJob(
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

  it('consumes a completed consultation through Inngest and persists the intake transition', async () => {
    const intake = await intakeFixture.registerIntake({
      status: IntakeStatus.ConsultationScheduled,
    })

    await inngestFixture.client.send({
      name: ConsultationCompletedEvent._NAME,
      data: {
        consultationId: CONSULTATION_ID,
        intakeId: intake.id,
        completedBy: COMPLETED_BY,
        occurredAt: new Date().toISOString(),
      },
    })

    await expect
      .poll(async () => intakeFixture.intakesRepository.findById(intake.id), {
        timeout: 20_000,
      })
      .toMatchObject({
        status: IntakeStatus.ConsultationCompleted,
        updatedBy: COMPLETED_BY,
        version: intake.version + 1,
      })
  }, 30_000)
})
