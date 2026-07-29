import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'

export class ActiveClientConsentNotFoundError extends NotFoundError {
  constructor(consentType: string) {
    super(`Nenhum consentimento ativo do tipo ${consentType} foi encontrado.`)
  }
}
