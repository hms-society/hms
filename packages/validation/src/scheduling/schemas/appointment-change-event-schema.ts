import {
  AppointmentCancelledEvent,
  AppointmentRescheduledEvent,
} from '@hms/core/scheduling/domain/events'
import { z } from 'zod'

const uuidSchema = z.string().uuid()
const isoDatetimeSchema = z.iso.datetime({ offset: true })

const appointmentChangeBaseSchema = {
  changeId: uuidSchema,
  appointmentId: uuidSchema,
  clientId: uuidSchema,
  actorId: uuidSchema,
}

const appointmentCancelledPayloadSchema = z.strictObject({
  ...appointmentChangeBaseSchema,
  scheduleId: uuidSchema,
  startsAt: isoDatetimeSchema,
  endsAt: isoDatetimeSchema,
  cancelledAt: isoDatetimeSchema,
})

const appointmentRescheduledPayloadSchema = z.strictObject({
  ...appointmentChangeBaseSchema,
  previousScheduleId: uuidSchema,
  newScheduleId: uuidSchema,
  previousStartsAt: isoDatetimeSchema,
  previousEndsAt: isoDatetimeSchema,
  newStartsAt: isoDatetimeSchema,
  newEndsAt: isoDatetimeSchema,
  rescheduledAt: isoDatetimeSchema,
})

export const appointmentChangeEventSchema = z.discriminatedUnion('name', [
  z.strictObject({
    name: z.literal(AppointmentCancelledEvent._NAME),
    payload: appointmentCancelledPayloadSchema,
  }),
  z.strictObject({
    name: z.literal(AppointmentRescheduledEvent._NAME),
    payload: appointmentRescheduledPayloadSchema,
  }),
])

export type AppointmentChangeEvent = z.infer<typeof appointmentChangeEventSchema>
