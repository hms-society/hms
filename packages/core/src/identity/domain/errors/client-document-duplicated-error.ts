import { ConflictError } from '#shared/domain/errors'

export class ClientDocumentDuplicatedError extends ConflictError {
  constructor(message = 'Documento já cadastrado para outra pessoa.') {
    super(message)
  }
}
