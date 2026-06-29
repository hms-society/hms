import { AppError } from '#shared/domain/errors/app-error.ts'

export class InvalidFormTemplateError extends AppError {
  constructor() {
    super('O template da ficha é inválido.', 'Template inválido')
  }
}
