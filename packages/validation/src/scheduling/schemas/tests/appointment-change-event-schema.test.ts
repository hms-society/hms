import {
  AppointmentCancelledEvent,
  AppointmentRescheduledEvent,
} from '@hms/core/scheduling/domain/events'
import { describe, expect, it } from 'vitest'

import { appointmentChangeEventSchema } from '../appointment-change-event-schema'

const ids = {
  changeId: '00000000-0000-4000-8000-000000000001',
  appointmentId: '00000000-0000-4000-8000-000000000002',
  clientId: '00000000-0000-4000-8000-000000000004',
  actorId: '00000000-0000-4000-8000-000000000005',
}
const rescheduleScheduleIds = {
  previousScheduleId: '00000000-0000-4000-8000-000000000003',
  newScheduleId: '00000000-0000-4000-8000-000000000006',
}

describe('appointmentChangeEventSchema', () => {
  it('accepts the complete cancellation envelope', () => {
    const result = appointmentChangeEventSchema.safeParse({
      name: AppointmentCancelledEvent._NAME,
      payload: {
        ...ids,
        scheduleId: '00000000-0000-4000-8000-000000000003',
        startsAt: '2026-09-25T13:00:00.000Z',
        endsAt: '2026-09-25T14:00:00.000Z',
        cancelledAt: '2026-09-24T12:00:00.000Z',
      },
    })

    expect(result.success).toBe(true)
  })

  it('accepts the complete rescheduling envelope', () => {
    const result = appointmentChangeEventSchema.safeParse({
      name: AppointmentRescheduledEvent._NAME,
      payload: {
        ...ids,
        ...rescheduleScheduleIds,
        previousStartsAt: '2026-09-25T13:00:00.000Z',
        previousEndsAt: '2026-09-25T14:00:00.000Z',
        newStartsAt: '2026-09-26T13:00:00.000Z',
        newEndsAt: '2026-09-26T14:00:00.000Z',
        rescheduledAt: '2026-09-24T12:00:00.000Z',
      },
    })

    expect(result.success).toBe(true)
  })

  it('rejects the wrong discriminant and incomplete payloads', () => {
    const result = appointmentChangeEventSchema.safeParse({
      name: AppointmentRescheduledEvent._NAME,
      payload: {
        ...ids,
        ...rescheduleScheduleIds,
        previousStartsAt: '2026-09-25T13:00:00.000Z',
      },
    })

    expect(result.success).toBe(false)
  })
})
