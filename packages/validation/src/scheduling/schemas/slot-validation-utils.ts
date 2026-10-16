export type AvailabilitySlot = {
  start: string
  end: string
}

export type SlotValidationResult =
  | { success: true; slots: AvailabilitySlot[] }
  | { success: false; error: string }

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function validateAndMergeSlot(
  existingSlots: AvailabilitySlot[],
  newSlot: AvailabilitySlot,
  minDurationMinutes = 0,
): SlotValidationResult {
  const newStart = timeToMinutes(newSlot.start)
  const newEnd = timeToMinutes(newSlot.end)

  if (Number.isNaN(newStart) || Number.isNaN(newEnd)) {
    return { success: false, error: 'Horário inválido' }
  }

  if (newEnd <= newStart) {
    return {
      success: false,
      error: 'O horário final deve ser posterior ao horário inicial',
    }
  }

  if (minDurationMinutes > 0 && newEnd - newStart < minDurationMinutes) {
    return {
      success: false,
      error: `O intervalo deve ter no mínimo ${minDurationMinutes} minutos`,
    }
  }

  for (const slot of existingSlots) {
    const start = timeToMinutes(slot.start)
    const end = timeToMinutes(slot.end)

    // Overlap ou Contenção: [newStart, newEnd] colide com [start, end]
    // Exceto se forem adjacentes (newStart === end || newEnd === start)
    const overlaps = newStart < end && newEnd > start

    if (overlaps) {
      return { success: false, error: 'Os horários não podem se sobrepor' }
    }
  }

  // Se não há sobreposição, une os intervalos adjacentes se houver
  const allIntervals = [...existingSlots, newSlot].map((s) => ({
    start: timeToMinutes(s.start),
    end: timeToMinutes(s.end),
  }))

  allIntervals.sort((a, b) => a.start - b.start)

  const merged: { start: number; end: number }[] = []

  for (const interval of allIntervals) {
    if (merged.length === 0) {
      merged.push({ ...interval })
      continue
    }

    const last = merged[merged.length - 1]

    if (interval.start === last.end) {
      // Adjacente: funde os intervalos
      last.end = interval.end
    } else {
      merged.push({ ...interval })
    }
  }

  return {
    success: true,
    slots: merged.map((m) => ({
      start: minutesToTime(m.start),
      end: minutesToTime(m.end),
    })),
  }
}
