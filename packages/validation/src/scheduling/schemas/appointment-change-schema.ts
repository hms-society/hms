import { z } from 'zod'

const uuidSchema = z.string().uuid()
const isoDatetimeSchema = z.iso.datetime({ offset: true })

export const appointmentChangeSchema = z.strictObject({
  expectedRevision: isoDatetimeSchema,
  startsAt: isoDatetimeSchema.optional(),
})

export const cancelAppointmentChangeSchema = appointmentChangeSchema.omit({
  startsAt: true,
})

export const rescheduleAppointmentChangeSchema = appointmentChangeSchema.extend({
  startsAt: isoDatetimeSchema,
  lawyerId: uuidSchema.optional(),
})

export type AppointmentChangeInput = z.input<typeof appointmentChangeSchema>
export type RescheduleAppointmentChangeInput = z.input<
  typeof rescheduleAppointmentChangeSchema
>
