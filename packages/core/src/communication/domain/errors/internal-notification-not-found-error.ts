import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class InternalNotificationNotFoundError extends NotFoundError {
  constructor() {
    super('Notificação interna não encontrada.')
  }
}
