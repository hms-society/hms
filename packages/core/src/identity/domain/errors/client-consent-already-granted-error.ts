import { ConflictError } from '#shared/domain/errors/conflict-error'

export class ClientConsentAlreadyGrantedError extends ConflictError {
  constructor(consentType: string) {
    super(`O consentimento ${consentType} já está ativo.`)
  }
}
