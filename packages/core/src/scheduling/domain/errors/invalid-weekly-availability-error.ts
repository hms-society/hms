import { AppError } from '#shared/domain/errors/app-error'

export class InvalidWeeklyAvailabilityError extends AppError {
  constructor() {
    super(
      'Os horários de disponibilidade devem ser válidos e não podem se sobrepor.',
      'Disponibilidade semanal inválida',
    )
  }
}
