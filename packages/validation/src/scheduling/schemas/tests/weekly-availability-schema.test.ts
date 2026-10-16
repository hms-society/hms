import { describe, expect, it } from 'vitest'
import {
  validateAndMergeSlot,
  timeToMinutes,
  minutesToTime,
} from '../slot-validation-utils'
import { weeklyAvailabilitySchema } from '../weekly-availability-schema'

describe('slot-validation-utils', () => {
  it('converts time to minutes and vice-versa', () => {
    expect(timeToMinutes('09:00')).toBe(540)
    expect(timeToMinutes('12:30')).toBe(750)
    expect(minutesToTime(540)).toBe('09:00')
    expect(minutesToTime(750)).toBe('12:30')
  })

  it('rejects slot when end <= start', () => {
    const res = validateAndMergeSlot([], { start: '12:00', end: '09:00' })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toBe('O horário final deve ser posterior ao horário inicial')
    }
  })

  it('rejects slot when duration is less than minDuration', () => {
    const res = validateAndMergeSlot([], { start: '09:00', end: '09:30' }, 45)
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toBe('O intervalo deve ter no mínimo 45 minutos')
    }
  })

  it('allows valid single slot', () => {
    const res = validateAndMergeSlot([], { start: '09:00', end: '12:00' })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.slots).toEqual([{ start: '09:00', end: '12:00' }])
    }
  })

  // CT-029
  it('allows multiple valid non-overlapping slots (CT-029)', () => {
    const existing = [{ start: '09:00', end: '12:00' }]
    const res = validateAndMergeSlot(existing, { start: '14:00', end: '18:00' })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.slots).toEqual([
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '18:00' },
      ])
    }
  })

  // CT-030
  it('rejects overlapping slot (CT-030)', () => {
    const existing = [{ start: '09:00', end: '12:00' }]
    const res = validateAndMergeSlot(existing, { start: '11:00', end: '13:00' })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toBe('Os horários não podem se sobrepor')
    }
  })

  // CT-031
  it('rejects contained slot (CT-031)', () => {
    const existing = [{ start: '09:00', end: '18:00' }]
    const res = validateAndMergeSlot(existing, { start: '10:00', end: '11:00' })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toBe('Os horários não podem se sobrepor')
    }
  })

  it('rejects slot containing existing slot', () => {
    const existing = [{ start: '10:00', end: '11:00' }]
    const res = validateAndMergeSlot(existing, { start: '09:00', end: '18:00' })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toBe('Os horários não podem se sobrepor')
    }
  })

  // Auto-merge adjacent slots
  it('merges adjacent slots when new slot starts right when existing ends', () => {
    const existing = [{ start: '09:00', end: '12:00' }]
    const res = validateAndMergeSlot(existing, { start: '12:00', end: '14:00' })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.slots).toEqual([{ start: '09:00', end: '14:00' }])
    }
  })

  it('merges adjacent slots when new slot ends right when existing starts', () => {
    const existing = [{ start: '12:00', end: '14:00' }]
    const res = validateAndMergeSlot(existing, { start: '09:00', end: '12:00' })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.slots).toEqual([{ start: '09:00', end: '14:00' }])
    }
  })
})

describe('weeklyAvailabilitySchema', () => {
  it('validates a valid weekly schedule', () => {
    const data = [
      {
        id: 'monday',
        name: 'Segunda-feira',
        active: true,
        slots: [
          { start: '09:00', end: '12:00' },
          { start: '14:00', end: '18:00' },
        ],
      },
    ]

    const parsed = weeklyAvailabilitySchema.safeParse(data)
    expect(parsed.success).toBe(true)
  })

  it('fails on overlapping slots in a day', () => {
    const data = [
      {
        id: 'monday',
        name: 'Segunda-feira',
        active: true,
        slots: [
          { start: '09:00', end: '12:00' },
          { start: '11:00', end: '13:00' },
        ],
      },
    ]

    const parsed = weeklyAvailabilitySchema.safeParse(data)
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toBe('Os horários não podem se sobrepor')
    }
  })

  it('accepts weekday as day identifier', () => {
    const data = [
      {
        weekday: 'monday',
        active: true,
        slots: [{ start: '09:00', end: '12:00' }],
      },
    ]

    const parsed = weeklyAvailabilitySchema.safeParse(data)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data[0].id).toBe('monday')
    }
  })
})
