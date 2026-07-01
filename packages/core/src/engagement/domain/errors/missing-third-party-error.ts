import { AppError } from '#shared/domain/errors/app-error.ts'

export class MissingThirdPartyError extends AppError {
  constructor() {
    super(
      'O identificador do terceiro é obrigatório para atendimentos de terceiros.',
      'Origem do atendimento inválida',
    )
  }
}
