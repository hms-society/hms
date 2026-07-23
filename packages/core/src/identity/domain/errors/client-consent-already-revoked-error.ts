import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class ClientConsentAlreadyRevokedError extends ConflictError {
  constructor(consentType: string) {
    super(`O consentimento ${consentType} já foi revogado.`)
  }
}
