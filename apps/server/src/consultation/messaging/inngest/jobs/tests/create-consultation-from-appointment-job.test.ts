import { ConsultationCreatedEvent } from '@hms/core/consultation/domain/events'
import { ConsultationModality } from '@hms/core/consultation/domain/structures'
import { AppointmentReservedEvent } from '@hms/core/scheduling/domain/events'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { ConsultationModuleFixture } from '@/consultation/fixtures/consultation-module-fixture'
import { InngestFixture } from '@/shared/messaging/inngest/fixtures/inngest-fixture'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { CreateConsultationFromAppointmentJob } from '../create-consultation-from-appointment-job'

const APPOINTMENT_ID = 'a15c7f30-aac7-4aa9-a642-2b09cd875da9'
const INTAKE_ID = 'fc6448b8-6050-4524-a938-e77bd58b160a'
const CLIENT_ID = '5bf49a7e-3024-4da9-befb-4e15d74e716f'
const LAWYER_ID = '47d29616-6209-4aca-b656-45ea507f90fd'
const SCHEDULE_ID = 'd2354e48-c043-4eb1-ad9d-910a6302f2b4'
const REQUESTED_BY = '79341eda-d65c-497c-a5bf-94c392031214'

describe('CreateConsultationFromAppointmentJob', () => {
  let inngestFixture: InngestFixture
  let consultationFixture: ConsultationModuleFixture
  const createdEvents: Record<string, unknown>[] = []

  beforeAll(async () => {
    consultationFixture = await ConsultationModuleFixture.register()
    try {
      inngestFixture = await InngestFixture.register({
        createFunctions(client) {
          const job = new CreateConsultationFromAppointmentJob(
            client,
            consultationFixture.consultationsRepository,
            new IdProvider(),
            new DatetimeProvider(),
          )
          const observer = client.createFunction(
            {
              id: 'integration/observe-consultation-created',
              triggers: [{ event: ConsultationCreatedEvent._NAME }],
            },
            ({ event }) => {
              createdEvents.push(event.data)
            },
          )
          return [job.function, observer]
        },
      })
    } catch (error) {
      await consultationFixture.close()
      throw error
    }
  })

  afterAll(async () => {
    try {
      await inngestFixture?.close()
    } finally {
      await consultationFixture?.close()
    }
  })

  it('creates the consultation in PostgreSQL and publishes its event through Inngest', async () => {
    await inngestFixture.client.send({
      name: AppointmentReservedEvent._NAME,
      data: {
        appointmentId: APPOINTMENT_ID,
        intakeId: INTAKE_ID,
        scheduleId: SCHEDULE_ID,
        clientId: CLIENT_ID,
        assignedLawyerId: LAWYER_ID,
        startsAt: '2026-10-05T13:00:00.000Z',
        endsAt: '2026-10-05T14:00:00.000Z',
        reservedAt: new Date().toISOString(),
        modality: ConsultationModality.InPerson,
        requestedBy: REQUESTED_BY,
      },
    })

    await expect
      .poll(() => consultationFixture.consultationsRepository.findByIntakeId(INTAKE_ID), {
        timeout: 20_000,
      })
      .toMatchObject({
        appointmentId: APPOINTMENT_ID,
        clientId: CLIENT_ID,
        assignedLawyerId: LAWYER_ID,
        modality: ConsultationModality.InPerson,
      })
    await expect.poll(() => createdEvents.length, { timeout: 20_000 }).toBe(1)
    expect(createdEvents[0]).toMatchObject({
      intakeId: INTAKE_ID,
      requestedBy: REQUESTED_BY,
    })
  }, 30_000)
})
