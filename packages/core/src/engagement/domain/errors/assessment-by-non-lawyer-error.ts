import { AppError } from '#shared/domain/errors/app-error.ts'

export class AssessmentByNonLawyerError extends AppError {
  constructor() {
    super(
      'A avaliação de viabilidade deve ser realizada por um advogado.',
      'Avaliador inválido',
    )
  }
}
