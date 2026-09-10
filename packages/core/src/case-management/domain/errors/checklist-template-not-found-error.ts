import { NotFoundError } from '#shared/domain/errors'

export class ChecklistTemplateNotFoundError extends NotFoundError {
  constructor() {
    super('Template de checklist não encontrado.')
  }
}
