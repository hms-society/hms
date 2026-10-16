import { CaseAccessIntent } from '../../case-management/domain/structures/case-access-intent'
import type { CaseAccessProvider } from '../../case-management/interfaces/case-access-provider'
import { ForbiddenError } from '../../shared/domain/errors/forbidden-error'
import type { CollaboratorsRepository, UsersRepository } from '../../identity/interfaces'
import type { LegalCasesRepository } from '../../case-management/interfaces/legal-cases-repository'
import type { CaseChecklistItemsRepository } from '../../case-management/interfaces/case-checklist-items-repository'
import type { DocumentValidationsRepository } from '../interfaces'
import { GetDocumentValidationUseCase } from './get-document-validation-use-case'
import type { ListDocumentValidationsRequest } from '../domain/structures'

export type { ListDocumentValidationsRequest } from '../domain/structures'

export class ListDocumentValidationsUseCase {
  private readonly getDocumentValidation: GetDocumentValidationUseCase

  constructor(
    private readonly documentValidationsRepository: DocumentValidationsRepository,
    private readonly caseAccessProvider: CaseAccessProvider,
    cases: LegalCasesRepository,
    checklistItems: CaseChecklistItemsRepository,
    collaborators: CollaboratorsRepository,
    users: UsersRepository,
  ) {
    this.getDocumentValidation = new GetDocumentValidationUseCase(
      documentValidationsRepository,
      caseAccessProvider,
      cases,
      checklistItems,
      collaborators,
      users,
    )
  }

  async execute(request: ListDocumentValidationsRequest) {
    if (request.caseId) {
      await this.caseAccessProvider.authorize({
        caseId: request.caseId,
        actorId: request.actorId,
        intent: CaseAccessIntent.ReadDocument,
      })
    }

    const records = await this.documentValidationsRepository.list({
      caseId: request.caseId,
      status: request.status,
    })
    const authorized = await Promise.all(
      records.map(async (record) => {
        try {
          return await this.getDocumentValidation.execute({
            documentFileId: record.id,
            actorId: request.actorId,
          })
        } catch (error) {
          if (error instanceof ForbiddenError) return undefined
          throw error
        }
      }),
    )

    return authorized.filter((record) => record !== undefined)
  }
}
