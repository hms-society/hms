import type { UseCase } from '#shared/interfaces/use-case'
import type { Pending } from '../domain/entities'
import type { PendingsRepository } from '../interfaces'

export class ListCasePendingsUseCase implements UseCase<string, readonly Pending[]> {
  constructor(private readonly pendingsRepository: PendingsRepository) {}

  execute(caseId: string) {
    return this.pendingsRepository.listByCaseId(caseId)
  }
}
