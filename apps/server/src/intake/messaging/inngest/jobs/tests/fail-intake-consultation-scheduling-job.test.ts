import { IntakeConsultationSchedulingFailedEvent } from '@hms/core/intake/domain/events'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { IntakeModuleFixture } from '@/intake/fixtures/intake-module-fixture'
import { FailIntakeConsultationSchedulingJob } from '@/intake/messaging/inngest/jobs/fail-intake-consultation-scheduling-job'

describe('Fail Intake Consultation Scheduling Job', () => {
  let fixture: IntakeModuleFixture

  beforeAll(async () => {
    fixture = await IntakeModuleFixture.register({
      inngestJob: FailIntakeConsultationSchedulingJob,
    })
  })

  afterAll(async () => {
    await fixture?.close()
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
  })

  it('persists the failed scheduling outcome through a real Inngest run', async () => {
    const intake = await fixture.registerIntake({
      status: IntakeStatus.ConsultationScheduling,
    })
    const requestedBy = fixture.idProvider.generate()
    const event = new IntakeConsultationSchedulingFailedEvent({
      intakeId: intake.id,
      requestedBy,
      failedAt: fixture.datetimeProvider.now(),
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(fixture.inngestFunctionOptions.id).toBe(FailIntakeConsultationSchedulingJob.ID)
    expect(run.status.toLowerCase()).toBe('completed')
    await expect(fixture.findIntake(intake.id)).resolves.toMatchObject({
      id: intake.id,
      status: IntakeStatus.ConsultationSchedulingFailed,
      updatedBy: requestedBy,
      version: intake.version + 1,
    })
  })

  it('is idempotent when scheduling has already failed', async () => {
    const intake = await fixture.registerIntake({
      status: IntakeStatus.ConsultationSchedulingFailed,
    })
    const event = new IntakeConsultationSchedulingFailedEvent({
      intakeId: intake.id,
      requestedBy: fixture.idProvider.generate(),
      failedAt: fixture.datetimeProvider.now(),
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(run.status.toLowerCase()).toBe('completed')
    await expect(fixture.findIntake(intake.id)).resolves.toMatchObject({
      status: IntakeStatus.ConsultationSchedulingFailed,
      updatedBy: intake.updatedBy,
      version: intake.version,
    })
  })

  it('rejects failure after the consultation has been scheduled', async () => {
    const intake = await fixture.registerIntake({
      status: IntakeStatus.ConsultationScheduled,
    })
    const event = new IntakeConsultationSchedulingFailedEvent({
      intakeId: intake.id,
      requestedBy: fixture.idProvider.generate(),
      failedAt: fixture.datetimeProvider.now(),
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(run.status.toLowerCase()).toBe('failed')
    await expect(fixture.findIntake(intake.id)).resolves.toMatchObject({
      status: IntakeStatus.ConsultationScheduled,
      updatedBy: intake.updatedBy,
      version: intake.version,
    })
  })
})
