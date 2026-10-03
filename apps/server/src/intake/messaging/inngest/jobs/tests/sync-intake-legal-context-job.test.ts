import { ConsultationLegalContextUpdatedEvent } from '@hms/core/consultation/domain/events'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { IntakeModuleFixture } from '@/intake/fixtures/intake-module-fixture'
import { InngestFixture } from '@/shared/messaging/inngest/fixtures/inngest-fixture'
import { SyncIntakeLegalContextJob } from '../sync-intake-legal-context-job'

const UPDATED_BY = '79341eda-d65c-497c-a5bf-94c392031214'
const CONSULTATION_ID = 'f7aab3e3-5474-4fdb-8d45-8508e44b7029'
const LEGAL_AREA_ID = '5cd55f41-a788-4a45-9619-364c8fd466dc'
const LEGAL_TOPIC_ID = 'eedf2501-11e3-4258-89c1-a4756c02725d'

describe('SyncIntakeLegalContextJob', () => {
  let intakeFixture: IntakeModuleFixture
  let inngestFixture: InngestFixture

  beforeAll(async () => {
    intakeFixture = await IntakeModuleFixture.register()
    try {
      inngestFixture = await InngestFixture.register({
        createFunctions(client) {
          return [
            new SyncIntakeLegalContextJob(client, intakeFixture.intakesRepository)
              .function,
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

  it('consumes a legal-context update through Inngest and persists both legal references', async () => {
    const intake = await intakeFixture.registerIntake({
      status: IntakeStatus.ConsultationScheduled,
    })

    await inngestFixture.client.send({
      name: ConsultationLegalContextUpdatedEvent._NAME,
      data: {
        consultationId: CONSULTATION_ID,
        intakeId: intake.id,
        legalAreaId: LEGAL_AREA_ID,
        legalTopicId: LEGAL_TOPIC_ID,
        updatedBy: UPDATED_BY,
        occurredAt: new Date().toISOString(),
      },
    })

    await expect
      .poll(async () => intakeFixture.intakesRepository.findById(intake.id), {
        timeout: 20_000,
      })
      .toMatchObject({
        legalAreaId: LEGAL_AREA_ID,
        legalTopicId: LEGAL_TOPIC_ID,
        updatedBy: UPDATED_BY,
        version: intake.version + 1,
      })
  }, 30_000)
})
