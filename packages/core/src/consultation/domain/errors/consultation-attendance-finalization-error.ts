import { BadRequestError } from '#shared/domain/errors/bad-request-error'

export class ConsultationAttendanceFinalizationError extends BadRequestError {
  constructor(message: string) {
    super(message)
  }
}
