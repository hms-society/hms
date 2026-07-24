import { ConflictError } from '#shared/domain/errors/conflict-error'

export class MessageContentRequiredError extends ConflictError {
  constructor() {
    super('A mensagem deve possuir texto ou pelo menos um arquivo.')
  }
}
