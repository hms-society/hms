import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'

export class ActiveConsentNotFoundError extends NotFoundError {
  constructor(consentType: string) {
    super(`Nenhum consentimento ativo do tipo ${consentType} foi encontrado.`)
  }
}
