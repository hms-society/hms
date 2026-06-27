import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class ConsentAlreadyRevokedError extends ConflictError {
  constructor(consentType: string) {
    super(`O consentimento ${consentType} já foi revogado.`)
  }
}
