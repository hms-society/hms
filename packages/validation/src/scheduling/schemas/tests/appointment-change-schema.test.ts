import { describe, expect, it } from 'vitest'

import {
  appointmentChangeSchema,
  cancelAppointmentChangeSchema,
  rescheduleAppointmentChangeSchema,
} from '../appointment-change-schema'

const expectedRevision = '2026-09-24T12:00:00.000Z'
const startsAt = '2026-09-25T13:00:00.000Z'

describe('appointment change schemas', () => {
  it('accepts an optimistic revision with an optional start', () => {
    expect(appointmentChangeSchema.parse({ expectedRevision, startsAt })).toEqual({
      expectedRevision,
      startsAt,
    })
    expect(appointmentChangeSchema.parse({ expectedRevision })).toEqual({
      expectedRevision,
    })
  })

  it('requires a new start for rescheduling and omits it for cancellation', () => {
    expect(
      rescheduleAppointmentChangeSchema.safeParse({ expectedRevision }).success,
    ).toBe(false)
    expect(
      cancelAppointmentChangeSchema.safeParse({ expectedRevision, startsAt }).success,
    ).toBe(false)
  })

  it('rejects malformed and offset-less instants', () => {
    const result = rescheduleAppointmentChangeSchema.safeParse({
      expectedRevision: '2026-09-24',
      startsAt: '2026-09-25T13:00:00',
    })

    expect(result.success).toBe(false)
  })
})
