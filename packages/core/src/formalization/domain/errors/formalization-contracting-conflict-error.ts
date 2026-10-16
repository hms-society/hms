import { ConflictError } from '../../../shared/domain/errors/conflict-error'

export class FormalizationContractingConflictError extends ConflictError {
  constructor(message = 'A contratação foi alterada por outra operação.') {
    super(message)
  }
}
