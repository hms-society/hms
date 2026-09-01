import { ForbiddenError } from '../../../shared/domain/errors/forbidden-error'

export class FormalizationAccessDeniedError extends ForbiddenError {
  constructor() {
    super(
      'Somente o advogado associado ou um administrador pode operar esta formalização.',
    )
  }
}
