import { ConflictError } from '#shared/domain/errors/conflict-error'

export class DynamicFormNameConflictError extends ConflictError {
  constructor(public readonly existingDynamicFormId: string) {
    super('Já existe uma ficha dinâmica com esse nome.')
  }
}
