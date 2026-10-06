import { IntakeConsultationSchedulingFailedEvent } from '@hms/core/intake/domain/events'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { IntakeModuleFixture } from '@/intake/fixtures/intake-module-fixture'
import { InngestFixture } from '@/shared/messaging/inngest/fixtures/inngest-fixture'
import { FailIntakeConsultationSchedulingJob } from '../fail-intake-consultation-scheduling-job'

const REQUESTED_BY = '79341eda-d65c-497c-a5bf-94c392031214'

describe('FailIntakeConsultationSchedulingJob', () => {
  let intakeFixture: IntakeModuleFixture
  let inngestFixture: InngestFixture

  beforeAll(async () => {
    intakeFixture = await IntakeModuleFixture.register()
    try {
      inngestFixture = await InngestFixture.register({
        createFunctions(client) {
          return [
            new FailIntakeConsultationSchedulingJob(
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

  it('consumes a scheduling failure through Inngest and persists the failed status', async () => {
    const intake = await intakeFixture.registerIntake({
      status: IntakeStatus.ConsultationScheduling,
    })

    await inngestFixture.client.send({
      name: IntakeConsultationSchedulingFailedEvent._NAME,
      data: {
        intakeId: intake.id,
        requestedBy: REQUESTED_BY,
        failedAt: new Date().toISOString(),
      },
    })

    await expect
      .poll(async () => intakeFixture.intakesRepository.findById(intake.id), {
        timeout: 20_000,
      })
      .toMatchObject({
        status: IntakeStatus.ConsultationSchedulingFailed,
        updatedBy: REQUESTED_BY,
        version: intake.version + 1,
      })
  }, 30_000)
})
