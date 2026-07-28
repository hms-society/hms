import { BadRequestError } from '#shared/domain/errors/bad-request-error'

export class InvalidCredentialsError extends BadRequestError {
  constructor() {
    super('Identificador ou senha inválidos.')
  }
}
