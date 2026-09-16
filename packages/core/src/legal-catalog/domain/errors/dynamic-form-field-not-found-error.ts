import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class DynamicFormFieldNotFoundError extends NotFoundError {
  constructor(
    public readonly dynamicFormId: string,
    public readonly fieldId: string,
  ) {
    super(`O campo ${fieldId} não pertence à ficha dinâmica ${dynamicFormId}.`)
  }
}
