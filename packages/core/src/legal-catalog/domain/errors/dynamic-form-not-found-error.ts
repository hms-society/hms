import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class DynamicFormNotFoundError extends NotFoundError {
  constructor(dynamicFormId: string) {
    super(`A ficha dinâmica ${dynamicFormId} não foi encontrada.`)
  }
}
