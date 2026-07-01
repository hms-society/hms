import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'

export class FeasibilityAssessmentNotFoundError extends NotFoundError {
  constructor() {
    super('Avaliação de viabilidade não encontrada.')
  }
}
