import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class ThirdPartyResponsibleNotFoundError extends NotFoundError {
  constructor() {
    super('O responsável interno informado não foi encontrado.')
  }
}
