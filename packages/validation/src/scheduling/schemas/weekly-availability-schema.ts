import { z } from 'zod'
import { timeToMinutes } from './slot-validation-utils'

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

export const availabilitySlotSchema = z
  .object({
    start: z.string().regex(timeRegex, 'Formato de horário inválido (HH:mm)'),
    end: z.string().regex(timeRegex, 'Formato de horário inválido (HH:mm)'),
  })
  .refine((slot) => timeToMinutes(slot.end) > timeToMinutes(slot.start), {
    message: 'O horário final deve ser posterior ao horário inicial',
    path: ['end'],
  })

export const dayAvailabilitySchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    active: z.boolean(),
    slots: z.array(availabilitySlotSchema).default([]),
  })
  .superRefine((day, ctx) => {
    if (!day.active || !day.slots || day.slots.length <= 1) {
      return
    }

    const sorted = [...day.slots].sort(
      (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start),
    )

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i]
      const next = sorted[i + 1]

      const currentEnd = timeToMinutes(current.end)
      const nextStart = timeToMinutes(next.start)

      // Sobreposição ou contenção: nextStart < currentEnd
      if (nextStart < currentEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Os horários não podem se sobrepor',
          path: ['slots', i + 1],
        })
      }
    }
  })

export const weeklyAvailabilitySchema = z.array(dayAvailabilitySchema)

export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>
export type DayAvailabilityInput = z.infer<typeof dayAvailabilitySchema>
export type WeeklyAvailabilityInput = z.infer<typeof weeklyAvailabilitySchema>
