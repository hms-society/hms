import { AppError } from '#shared/domain/errors/app-error.ts'

export class MissingInfeasibilityReasonError extends AppError {
  constructor() {
    super(
      'Motivo de inviabilidade é obrigatório para avaliações inviáveis.',
      'Avaliação inválida',
    )
  }
}
