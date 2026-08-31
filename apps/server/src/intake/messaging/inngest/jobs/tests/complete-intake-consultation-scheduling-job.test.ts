import { ConsultationCreatedEvent } from '@hms/core/consultation/domain/events'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { IntakeModuleFixture } from '@/intake/fixtures/intake-module-fixture'
import { CompleteIntakeConsultationSchedulingJob } from '@/intake/messaging/inngest/jobs/complete-intake-consultation-scheduling-job'

describe('Complete Intake Consultation Scheduling Job', () => {
  let fixture: IntakeModuleFixture

  beforeAll(async () => {
    fixture = await IntakeModuleFixture.register({
      inngestJob: CompleteIntakeConsultationSchedulingJob,
    })
  })

  afterAll(async () => {
    await fixture?.close()
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
  })

  it('persists the scheduled consultation outcome through a real Inngest run', async () => {
    const intake = await fixture.registerIntake({
      status: IntakeStatus.ConsultationScheduling,
    })
    const requestedBy = fixture.idProvider.generate()
    const event = new ConsultationCreatedEvent({
      consultationId: fixture.idProvider.generate(),
      intakeId: intake.id,
      requestedBy,
      occurredAt: fixture.datetimeProvider.now(),
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(fixture.inngestFunctionOptions.id).toBe(
      CompleteIntakeConsultationSchedulingJob.ID,
    )
    expect(run.status.toLowerCase()).toBe('completed')
    await expect(fixture.findIntake(intake.id)).resolves.toMatchObject({
      id: intake.id,
      status: IntakeStatus.ConsultationScheduled,
      updatedBy: requestedBy,
      version: intake.version + 1,
    })
  })

  it('completes a retry after a previous scheduling failure', async () => {
    const intake = await fixture.registerIntake({
      status: IntakeStatus.ConsultationSchedulingFailed,
    })
    const requestedBy = fixture.idProvider.generate()
    const event = new ConsultationCreatedEvent({
      consultationId: fixture.idProvider.generate(),
      intakeId: intake.id,
      requestedBy,
      occurredAt: fixture.datetimeProvider.now(),
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(run.status.toLowerCase()).toBe('completed')
    await expect(fixture.findIntake(intake.id)).resolves.toMatchObject({
      status: IntakeStatus.ConsultationScheduled,
      updatedBy: requestedBy,
      version: intake.version + 1,
    })
  })

  it('is idempotent when the consultation is already scheduled', async () => {
    const intake = await fixture.registerIntake({
      status: IntakeStatus.ConsultationScheduled,
    })
    const event = new ConsultationCreatedEvent({
      consultationId: fixture.idProvider.generate(),
      intakeId: intake.id,
      requestedBy: fixture.idProvider.generate(),
      occurredAt: fixture.datetimeProvider.now(),
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(run.status.toLowerCase()).toBe('completed')
    await expect(fixture.findIntake(intake.id)).resolves.toMatchObject({
      status: IntakeStatus.ConsultationScheduled,
      updatedBy: intake.updatedBy,
      version: intake.version,
    })
  })

  it('rejects scheduling completion from an incompatible status', async () => {
    const intake = await fixture.registerIntake({ status: IntakeStatus.Registered })
    const event = new ConsultationCreatedEvent({
      consultationId: fixture.idProvider.generate(),
      intakeId: intake.id,
      requestedBy: fixture.idProvider.generate(),
      occurredAt: fixture.datetimeProvider.now(),
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(run.status.toLowerCase()).toBe('failed')
    await expect(fixture.findIntake(intake.id)).resolves.toMatchObject({
      status: IntakeStatus.Registered,
      updatedBy: intake.updatedBy,
      version: intake.version,
    })
  })
})
