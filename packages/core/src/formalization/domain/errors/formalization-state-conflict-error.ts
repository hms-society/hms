import { ConflictError } from '../../../shared/domain/errors/conflict-error'

export class FormalizationStateConflictError extends ConflictError {
  constructor(
    message = 'A formalização não pode receber esta alteração no estado atual.',
  ) {
    super(message)
  }
}
