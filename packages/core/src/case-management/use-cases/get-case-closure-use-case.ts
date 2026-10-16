import type { UseCase } from '#shared/interfaces/use-case'

import { LegalCaseNotFoundError } from '../domain/errors'
import type { CaseClosureSnapshot } from '../domain/structures/case-closure-snapshot'
import type { CaseClosureRepository } from '../interfaces/case-closure-repository'

type Request = {
  caseId: string
}

export class GetCaseClosureUseCase implements UseCase<Request, CaseClosureSnapshot> {
  constructor(private readonly closureRepository: CaseClosureRepository) {}

  async execute({ caseId }: Request): Promise<CaseClosureSnapshot> {
    const snapshot = await this.closureRepository.getSnapshot(caseId)
    if (!snapshot) throw new LegalCaseNotFoundError()
    return snapshot
  }
}
