import { ConflictError } from '#shared/domain/errors/conflict-error'

export class InvalidMessageDeliveryStatusError extends ConflictError {
  constructor() {
    super('A mensagem não está em uma situação de entrega válida para esta operação.')
  }
}
