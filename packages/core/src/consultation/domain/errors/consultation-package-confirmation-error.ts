import { BadRequestError } from '#shared/domain/errors/bad-request-error'

export class ConsultationPackageConfirmationError extends BadRequestError {
  constructor(message: string) {
    super(message)
  }
}
