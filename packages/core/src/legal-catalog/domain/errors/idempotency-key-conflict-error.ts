import { ConflictError } from '#shared/domain/errors/conflict-error'

export class IdempotencyKeyConflictError extends ConflictError {
  constructor(
    public readonly operationKey: string,
    public readonly originalAction: 'duplicated' | 'created' | 'updated',
    public readonly originalTargetDynamicFormId: string,
  ) {
    super('A chave de operação já foi utilizada para outra solicitação.')
  }
}
