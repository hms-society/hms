import { ConflictError } from '#shared/domain/errors/conflict-error'

export class ClientConsentAlreadyRevokedError extends ConflictError {
  constructor(consentType: string) {
    super(`O consentimento ${consentType} já foi revogado.`)
  }
}
