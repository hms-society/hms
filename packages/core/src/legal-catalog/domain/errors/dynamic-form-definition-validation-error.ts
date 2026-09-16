import type { DynamicFormValidationIssue } from '#shared/domain/structures/dynamic-form-validation-issue'
import { BadRequestError } from '#shared/domain/errors/bad-request-error'

export class DynamicFormDefinitionValidationError extends BadRequestError {
  constructor(public readonly issues: readonly DynamicFormValidationIssue[]) {
    super('A definição da ficha dinâmica é inválida.')
  }
}
