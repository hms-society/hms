const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo'

export function getTodayInSaoPaulo() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  return `${year}-${month}-${day}`
}

export function parseCivilDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function formatCivilDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function addCivilDays(value: string, days: number) {
  const date = parseCivilDate(value)
  date.setUTCDate(date.getUTCDate() + days)
  return formatCivilDate(date)
}

export function getWeekStart(value: string) {
  const date = parseCivilDate(value)
  date.setUTCDate(date.getUTCDate() - date.getUTCDay())
  return formatCivilDate(date)
}

export function getWeekDays(value: string) {
  const start = getWeekStart(value)
  return Array.from({ length: 7 }, (_, index) => addCivilDays(start, index))
}

export function getMonthDays(value: string) {
  const date = parseCivilDate(value)
  const first = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  first.setUTCDate(first.getUTCDate() - first.getUTCDay())
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
  last.setUTCDate(last.getUTCDate() + (6 - last.getUTCDay()))
  const days = Math.round((last.getTime() - first.getTime()) / 86_400_000) + 1
  return Array.from({ length: Math.min(days, 42) }, (_, index) =>
    addCivilDays(formatCivilDate(first), index),
  )
}

export function formatDateLabel(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    ...options,
  }).format(parseCivilDate(value))
}

export function formatDateTime(value: string, timeZone = SAO_PAULO_TIME_ZONE) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatTime(value: string, timeZone = SAO_PAULO_TIME_ZONE) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function getLocalDate(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value))
  return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}-${parts.find((part) => part.type === 'day')?.value}`
}

export function formatDuration(startsAt: string, endsAt: string) {
  return Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000)
}
