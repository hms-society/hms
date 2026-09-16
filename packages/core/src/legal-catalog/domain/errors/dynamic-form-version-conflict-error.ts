import { ConflictError } from '#shared/domain/errors/conflict-error'

export class DynamicFormVersionConflictError extends ConflictError {
  constructor(
    public readonly dynamicFormId: string,
    public readonly expectedVersion: number,
    public readonly currentVersion: number,
  ) {
    super('A ficha dinâmica foi alterada por outra sessão.')
  }
}
