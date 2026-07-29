import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class ClientConsentAlreadyGrantedError extends ConflictError {
  constructor(consentType: string) {
    super(`O consentimento ${consentType} já está ativo.`)
  }
}
