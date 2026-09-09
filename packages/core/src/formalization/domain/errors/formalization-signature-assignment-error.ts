import { BadRequestError } from '#shared/domain/errors'

export class FormalizationSignatureAssignmentError extends BadRequestError {
  constructor(message = 'A atribuição de documentos da configuração é inválida.') {
    super(message)
  }
}
