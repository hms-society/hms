import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class ScheduleNotFoundError extends NotFoundError {
  constructor() {
    super('Agenda não encontrada.')
  }
}
