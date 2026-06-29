import { AppError } from '#shared/domain/errors/app-error.ts'

export class MissingConsultationSummaryError extends AppError {
  constructor() {
    super(
      'Resumo da consulta é obrigatório ao registrá-la como realizada.',
      'Consulta inválida',
    )
  }
}
