import { ConflictError } from '#shared/domain/errors'

export class FormalizationSignatoryDuplicateError extends ConflictError {
  constructor(message = 'A pessoa selecionada já é signatária desta formalização.') {
    super(message)
  }
}
