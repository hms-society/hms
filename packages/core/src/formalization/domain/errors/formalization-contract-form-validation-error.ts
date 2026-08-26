import type { DynamicFormValidationIssue } from '../../../shared/domain/structures'
import { BadRequestError } from '../../../shared/domain/errors/bad-request-error'

export class FormalizationContractFormValidationError extends BadRequestError {
  constructor(
    public readonly issues: readonly DynamicFormValidationIssue[],
    message = 'Corrija os campos inválidos do formulário de condições comerciais.',
  ) {
    super(message)
  }
}
