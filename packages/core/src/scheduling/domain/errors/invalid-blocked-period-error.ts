import { AppError } from '#shared/domain/errors/app-error'

export class InvalidBlockedPeriodError extends AppError {
  constructor() {
    super(
      'A data final do bloqueio deve ser igual ou posterior à data inicial.',
      'Período de bloqueio inválido',
    )
  }
}
