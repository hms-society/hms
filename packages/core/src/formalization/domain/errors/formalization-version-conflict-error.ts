import { ConflictError } from '../../../shared/domain/errors/conflict-error'

export class FormalizationVersionConflictError extends ConflictError {
  constructor() {
    super('A formalização foi alterada por outra operação.')
  }
}
