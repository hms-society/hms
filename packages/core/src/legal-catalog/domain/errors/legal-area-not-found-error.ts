import { NotFoundError } from '#shared/domain/errors'

export class LegalAreaNotFoundError extends NotFoundError {
  constructor() {
    super('Área do direito não encontrada.')
  }
}
