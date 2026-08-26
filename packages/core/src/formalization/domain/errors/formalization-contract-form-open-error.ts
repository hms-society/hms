import { ConflictError } from '../../../shared/domain/errors/conflict-error'

export class FormalizationContractFormOpenError extends ConflictError {
  constructor() {
    super('Feche o formulário de condições comerciais antes de operar os documentos.')
  }
}
