import { ConsultationModality } from '@hms/core/consultation/domain/structures'
import { IntakeConsultationSchedulingRequestedEvent } from '@hms/core/intake/domain/events'
import { AppointmentReservedEvent } from '@hms/core/scheduling/domain/events'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { SchedulingModuleFixture } from '@/scheduling/fixtures/scheduling-module-fixture'
import { InngestFixture } from '@/shared/messaging/inngest/fixtures/inngest-fixture'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { ReserveIntakeAppointmentJob } from '../reserve-intake-appointment-job'

const INTAKE_ID = 'fc6448b8-6050-4524-a938-e77bd58b160a'
const CLIENT_ID = '5bf49a7e-3024-4da9-befb-4e15d74e716f'
const LAWYER_ID = '47d29616-6209-4aca-b656-45ea507f90fd'
const REQUESTED_BY = '79341eda-d65c-497c-a5bf-94c392031214'
const STARTS_AT = '2026-10-05T13:00:00.000Z'

describe('ReserveIntakeAppointmentJob', () => {
  let inngestFixture: InngestFixture
  let schedulingFixture: SchedulingModuleFixture
  const reservedEvents: Record<string, unknown>[] = []

  beforeAll(async () => {
    schedulingFixture = await SchedulingModuleFixture.register()
    try {
      inngestFixture = await InngestFixture.register({
        createFunctions(client) {
          const job = new ReserveIntakeAppointmentJob(
            client,
            schedulingFixture.schedulesRepository,
            schedulingFixture.appointmentsRepository,
            new IdProvider(),
            new DatetimeProvider(),
          )
          const observer = client.createFunction(
            {
              id: 'integration/observe-appointment-reserved',
              triggers: [{ event: AppointmentReservedEvent._NAME }],
            },
            ({ event }) => {
              reservedEvents.push(event.data)
            },
          )
          return [job.function, observer]
        },
      })
    } catch (error) {
      await schedulingFixture.close()
      throw error
    }
  })

  afterAll(async () => {
    try {
      await inngestFixture?.close()
    } finally {
      await schedulingFixture?.close()
    }
  })

  it('reserves an appointment in PostgreSQL and publishes its event through Inngest', async () => {
    const schedule = await schedulingFixture.schedulesRepository.createSchedule({
      collaboratorId: LAWYER_ID,
      defaultDurationMinutes: 60,
      weeklyAvailability: [],
    })

    await inngestFixture.client.send({
      name: IntakeConsultationSchedulingRequestedEvent._NAME,
      data: {
        intakeId: INTAKE_ID,
        clientId: CLIENT_ID,
        assignedLawyerId: LAWYER_ID,
        startsAt: STARTS_AT,
        modality: ConsultationModality.InPerson,
        requestedBy: REQUESTED_BY,
        occurredAt: new Date().toISOString(),
      },
    })

    await expect
      .poll(() => schedulingFixture.appointmentsRepository.findByIntakeId(INTAKE_ID), {
        timeout: 20_000,
      })
      .toMatchObject({
        scheduleId: schedule.id,
        clientId: CLIENT_ID,
        startsAt: new Date(STARTS_AT),
        endsAt: new Date('2026-10-05T14:00:00.000Z'),
      })
    await expect.poll(() => reservedEvents.length, { timeout: 20_000 }).toBe(1)
    expect(reservedEvents[0]).toMatchObject({
      intakeId: INTAKE_ID,
      scheduleId: schedule.id,
      requestedBy: REQUESTED_BY,
    })
  }, 30_000)
})
