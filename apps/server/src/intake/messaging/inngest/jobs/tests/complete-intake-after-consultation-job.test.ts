import { ConsultationCompletedEvent } from '@hms/core/consultation/domain/events'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { IntakeModuleFixture } from '@/intake/fixtures/intake-module-fixture'
import { CompleteIntakeAfterConsultationJob } from '@/intake/messaging/inngest/jobs/complete-intake-after-consultation-job'

describe('Complete Intake After Consultation Job', () => {
  let fixture: IntakeModuleFixture

  beforeAll(async () => {
    fixture = await IntakeModuleFixture.register({
      inngestJob: CompleteIntakeAfterConsultationJob,
    })
  })

  afterAll(async () => {
    await fixture?.close()
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
  })

  it('persists consultation completion through a real Inngest run', async () => {
    const intake = await fixture.registerIntake({
      status: IntakeStatus.ConsultationScheduled,
    })
    const completedBy = fixture.idProvider.generate()
    const event = new ConsultationCompletedEvent({
      consultationId: fixture.idProvider.generate(),
      intakeId: intake.id,
      completedBy,
      occurredAt: fixture.datetimeProvider.now(),
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(fixture.inngestFunctionOptions.id).toBe(CompleteIntakeAfterConsultationJob.ID)
    expect(run.status.toLowerCase()).toBe('completed')
    await expect(fixture.findIntake(intake.id)).resolves.toMatchObject({
      id: intake.id,
      status: IntakeStatus.ConsultationCompleted,
      updatedBy: completedBy,
      version: intake.version + 1,
    })
  })

  it('is idempotent when the consultation is already completed', async () => {
    const intake = await fixture.registerIntake({
      status: IntakeStatus.ConsultationCompleted,
    })
    const event = new ConsultationCompletedEvent({
      consultationId: fixture.idProvider.generate(),
      intakeId: intake.id,
      completedBy: fixture.idProvider.generate(),
      occurredAt: fixture.datetimeProvider.now(),
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(run.status.toLowerCase()).toBe('completed')
    await expect(fixture.findIntake(intake.id)).resolves.toMatchObject({
      status: IntakeStatus.ConsultationCompleted,
      updatedBy: intake.updatedBy,
      version: intake.version,
    })
  })

  it('rejects completion before the consultation is scheduled', async () => {
    const intake = await fixture.registerIntake({
      status: IntakeStatus.ConsultationScheduling,
    })
    const event = new ConsultationCompletedEvent({
      consultationId: fixture.idProvider.generate(),
      intakeId: intake.id,
      completedBy: fixture.idProvider.generate(),
      occurredAt: fixture.datetimeProvider.now(),
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(run.status.toLowerCase()).toBe('failed')
    await expect(fixture.findIntake(intake.id)).resolves.toMatchObject({
      status: IntakeStatus.ConsultationScheduling,
      updatedBy: intake.updatedBy,
      version: intake.version,
    })
  })
})
