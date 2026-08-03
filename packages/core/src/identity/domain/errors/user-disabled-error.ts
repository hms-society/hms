import { ConflictError } from '#shared/domain/errors/conflict-error'

export class UserDisabledError extends ConflictError {
  constructor() {
    super('A conta do usuário está desabilitada.')
  }
}
