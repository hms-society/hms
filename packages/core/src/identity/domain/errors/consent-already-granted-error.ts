import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class ConsentAlreadyGrantedError extends ConflictError {
  constructor(consentType: string) {
    super(`O consentimento ${consentType} já está ativo.`)
  }
}
