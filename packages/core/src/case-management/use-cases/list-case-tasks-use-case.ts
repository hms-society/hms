import type { UseCase } from '#shared/interfaces/use-case'
import type { CaseTask } from '../domain/entities'
import type { CaseTasksRepository } from '../interfaces'

export class ListCaseTasksUseCase implements UseCase<string, readonly CaseTask[]> {
  constructor(private readonly caseTasksRepository: CaseTasksRepository) {}

  execute(caseId: string) {
    return this.caseTasksRepository.listByCaseId(caseId)
  }
}
