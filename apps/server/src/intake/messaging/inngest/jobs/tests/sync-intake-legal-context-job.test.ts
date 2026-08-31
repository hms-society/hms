import { ConsultationLegalContextUpdatedEvent } from '@hms/core/consultation/domain/events'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { IntakeModuleFixture } from '@/intake/fixtures/intake-module-fixture'
import { SyncIntakeLegalContextJob } from '@/intake/messaging/inngest/jobs/sync-intake-legal-context-job'

describe('Sync Intake Legal Context Job', () => {
  let fixture: IntakeModuleFixture

  beforeAll(async () => {
    fixture = await IntakeModuleFixture.register({
      inngestJob: SyncIntakeLegalContextJob,
    })
  })

  afterAll(async () => {
    await fixture?.close()
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
  })

  it('persists the consultation legal context through a real Inngest run', async () => {
    const intake = await fixture.registerIntake({
      status: IntakeStatus.ConsultationScheduled,
      legalAreaId: undefined,
      legalTopicId: undefined,
    })
    const legalAreaId = fixture.idProvider.generate()
    const legalTopicId = fixture.idProvider.generate()
    const updatedBy = fixture.idProvider.generate()
    const event = new ConsultationLegalContextUpdatedEvent({
      consultationId: fixture.idProvider.generate(),
      intakeId: intake.id,
      legalAreaId,
      legalTopicId,
      updatedBy,
      occurredAt: fixture.datetimeProvider.now(),
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(fixture.inngestFunctionOptions.id).toBe(SyncIntakeLegalContextJob.ID)
    expect(run.status.toLowerCase()).toBe('completed')
    await expect(fixture.findIntake(intake.id)).resolves.toMatchObject({
      id: intake.id,
      legalAreaId,
      legalTopicId,
      updatedBy,
      version: intake.version + 1,
    })
  })

  it('does not increment the version when the legal context is unchanged', async () => {
    const legalAreaId = fixture.idProvider.generate()
    const legalTopicId = fixture.idProvider.generate()
    const intake = await fixture.registerIntake({
      status: IntakeStatus.ConsultationScheduled,
      legalAreaId,
      legalTopicId,
    })
    const event = new ConsultationLegalContextUpdatedEvent({
      consultationId: fixture.idProvider.generate(),
      intakeId: intake.id,
      legalAreaId,
      legalTopicId,
      updatedBy: fixture.idProvider.generate(),
      occurredAt: fixture.datetimeProvider.now(),
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(run.status.toLowerCase()).toBe('completed')
    await expect(fixture.findIntake(intake.id)).resolves.toMatchObject({
      legalAreaId,
      legalTopicId,
      updatedBy: intake.updatedBy,
      version: intake.version,
    })
  })

  it.each([
    IntakeStatus.Contracted,
    IntakeStatus.ClosedWithoutContract,
  ])('rejects legal-context changes for terminal status %s', async (status) => {
    const intake = await fixture.registerIntake({ status })
    const event = new ConsultationLegalContextUpdatedEvent({
      consultationId: fixture.idProvider.generate(),
      intakeId: intake.id,
      legalAreaId: fixture.idProvider.generate(),
      legalTopicId: fixture.idProvider.generate(),
      updatedBy: fixture.idProvider.generate(),
      occurredAt: fixture.datetimeProvider.now(),
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(run.status.toLowerCase()).toBe('failed')
    await expect(fixture.findIntake(intake.id)).resolves.toMatchObject({
      status,
      legalAreaId: intake.legalAreaId,
      legalTopicId: intake.legalTopicId,
      updatedBy: intake.updatedBy,
      version: intake.version,
    })
  })
})
