import { BadRequestError } from './bad-request-error'

export class InvalidDynamicFormDefinitionError extends BadRequestError {
  constructor(message = 'A definição do formulário dinâmico é inválida.') {
    super(message)
  }
}
