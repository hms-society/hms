import { ConflictError } from '../../../shared/domain/errors/conflict-error'

export class FormalizationContractingNotReadyError extends ConflictError {
  constructor(message = 'A formalização ainda não está pronta para contratação.') {
    super(message)
  }
}
