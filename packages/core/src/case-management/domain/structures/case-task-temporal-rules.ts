import { BadRequestError } from '#shared/domain/errors'
import { CaseTaskType } from './case-task-type'

export function normalizeCaseTaskTime(
  type: CaseTaskType,
  plannedTime: string | undefined,
): string | undefined {
  if (type === CaseTaskType.ProcessDeadline && !plannedTime) return '23:59:00'
  if (type === CaseTaskType.Hearing && !plannedTime) {
    throw new BadRequestError('Audiências exigem horário.')
  }
  if (!plannedTime) return undefined
  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(plannedTime)) {
    throw new BadRequestError('O horário deve estar no formato HH:mm.')
  }
  return plannedTime.length === 5 ? `${plannedTime}:00` : plannedTime
}

export function assertValidCaseTaskDate(plannedDate: string, now: Date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(plannedDate)) {
    throw new BadRequestError('A data prevista deve estar no formato AAAA-MM-DD.')
  }
  const parsed = new Date(`${plannedDate}T00:00:00.000Z`)
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== plannedDate
  ) {
    throw new BadRequestError('A data prevista é inválida.')
  }
  const currentDate = new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`)
  if (parsed < currentDate) {
    throw new BadRequestError('A data prevista não pode ser anterior à data atual.')
  }
}
