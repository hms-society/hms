import { AppError } from '#shared/domain/errors/app-error.ts'

export class InvalidFormValuesError extends AppError {
  constructor() {
    super('Os dados da ficha são inválidos.', 'Ficha inválida')
  }
}
