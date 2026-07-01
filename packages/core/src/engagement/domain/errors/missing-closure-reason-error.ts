import { AppError } from '#shared/domain/errors/app-error.ts'

export class MissingClosureReasonError extends AppError {
  constructor() {
    super(
      'Motivo e justificativa de encerramento são obrigatórios.',
      'Encerramento inválido',
    )
  }
}
