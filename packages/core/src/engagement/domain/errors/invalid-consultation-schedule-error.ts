import { AppError } from '#shared/domain/errors/app-error.ts'

export class InvalidConsultationScheduleError extends AppError {
  constructor() {
    super('A data da consulta é inválida.', 'Agendamento inválido')
  }
}
