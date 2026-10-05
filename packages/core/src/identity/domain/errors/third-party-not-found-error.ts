import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class ThirdPartyNotFoundError extends NotFoundError {
  constructor() {
    super('Terceiro não encontrado.')
  }
}
