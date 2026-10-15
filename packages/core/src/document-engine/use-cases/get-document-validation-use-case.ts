import { CaseAccessIntent } from '../../case-management/domain/structures/case-access-intent'
import type { CaseAccessProvider } from '../../case-management/interfaces/case-access-provider'
import type { LegalCasesRepository } from '../../case-management/interfaces/legal-cases-repository'
import type { CaseChecklistItemsRepository } from '../../case-management/interfaces/case-checklist-items-repository'
import type { CollaboratorsRepository, UsersRepository } from '../../identity/interfaces'
import type { DocumentValidationDocument } from '../domain/entities/document-validation'
import { DocumentFileNotFoundError } from '../domain/errors'
import type { DocumentValidationsRepository } from '../interfaces'
import { ForbiddenError } from '../../shared/domain/errors/forbidden-error'
import type { GetDocumentValidationRequest } from '../domain/structures'

export type { GetDocumentValidationRequest } from '../domain/structures'

export class GetDocumentValidationUseCase {
  constructor(
    private readonly documentValidationsRepository: DocumentValidationsRepository,
    private readonly caseAccessProvider: CaseAccessProvider,
    private readonly cases: LegalCasesRepository,
    private readonly checklistItems: CaseChecklistItemsRepository,
    private readonly collaborators: CollaboratorsRepository,
    private readonly users: UsersRepository,
  ) {}

  async execute(
    request: GetDocumentValidationRequest,
  ): Promise<DocumentValidationDocument> {
    const record = await this.documentValidationsRepository.findByFileId(
      request.documentFileId,
    )

    if (!record) throw new DocumentFileNotFoundError()
    const caseId = record.checklistLink?.caseId
    await this.authorizeLinkedCase(caseId, request.actorId)
    const suggestions = await this.loadAuthorizedSuggestions(
      record,
      caseId,
      request.actorId,
    )
    return this.projectRecord(record, caseId, suggestions)
  }

  private async authorizeLinkedCase(caseId: string | undefined, actorId: string) {
    if (!caseId) return
    await this.caseAccessProvider.authorize({
      caseId,
      actorId,
      intent: CaseAccessIntent.ReadDocument,
    })
  }

  private async loadAuthorizedSuggestions(
    record: DocumentValidationDocument,
    caseId: string | undefined,
    actorId: string,
  ) {
    let duplicateMatch = record.duplicateMatch
    let aiSuggestion = record.aiSuggestion
    const duplicateFileId = duplicateMatch?.documentFileId
    const duplicate = duplicateFileId
      ? await this.documentValidationsRepository.findByFileId(duplicateFileId)
      : undefined

    if (duplicateFileId && !duplicate) {
      return { duplicate: undefined, duplicateMatch: undefined, aiSuggestion: undefined }
    }

    try {
      await this.authorizeLinkedCase(duplicate?.checklistLink?.caseId, actorId)
      const suggestedCaseId = this.getString(aiSuggestion, 'caseId')
      if (suggestedCaseId && suggestedCaseId !== caseId) {
        await this.authorizeLinkedCase(suggestedCaseId, actorId)
      }
    } catch (error) {
      if (!(error instanceof ForbiddenError)) throw error
      duplicateMatch = undefined
      aiSuggestion = undefined
    }

    return { duplicate, duplicateMatch, aiSuggestion }
  }

  private async projectRecord(
    record: DocumentValidationDocument,
    caseId: string | undefined,
    suggestions: Awaited<
      ReturnType<GetDocumentValidationUseCase['loadAuthorizedSuggestions']>
    >,
  ): Promise<DocumentValidationDocument> {
    const reviewer = record.reviewedBy
      ? await this.collaborators.findByUserId(record.reviewedBy)
      : undefined
    const reviewerUser = record.reviewedBy
      ? await this.users.findById(record.reviewedBy)
      : undefined
    const linkedCase = caseId ? await this.cases.findById(caseId) : undefined
    const linkedChecklist = caseId ? await this.checklistItems.listByCaseId(caseId) : []
    const checklistItemId = record.checklistLink?.checklistItemId
    const checklistItem = linkedChecklist.find((item) => item.id === checklistItemId)
    const duplicateMatch = await this.projectDuplicateMatch(suggestions)

    return {
      ...record,
      reviewedByName: reviewer?.professionalName ?? reviewerUser?.email,
      aiSuggestion: suggestions.aiSuggestion,
      checklistLink: {
        caseId,
        caseLabel: linkedCase?.title,
        checklistItemId,
        checklistItemLabel: checklistItem?.title,
      },
      duplicateMatch,
    }
  }

  private async projectDuplicateMatch(
    suggestions: Awaited<
      ReturnType<GetDocumentValidationUseCase['loadAuthorizedSuggestions']>
    >,
  ) {
    const { duplicate, duplicateMatch } = suggestions
    if (!duplicate || !duplicateMatch) return duplicateMatch

    const duplicateCaseId = duplicate.checklistLink?.caseId
    const duplicateCase = duplicateCaseId
      ? await this.cases.findById(duplicateCaseId)
      : undefined
    const duplicateChecklist = duplicateCaseId
      ? await this.checklistItems.listByCaseId(duplicateCaseId)
      : []
    const duplicateChecklistItemId = duplicate.checklistLink?.checklistItemId
    const duplicateChecklistItem = duplicateChecklist.find(
      (item) => item.id === duplicateChecklistItemId,
    )
    return {
      documentFileId: duplicate.id,
      fileName: duplicate.fileName,
      receivedAt: duplicate.receivedAt,
      hashSha256: duplicate.hashSha256,
      caseLabel: duplicateCase?.title,
      checklistItemLabel: duplicateChecklistItem?.title,
    }
  }

  private getString(record: Record<string, unknown> | undefined, key: string) {
    const value = record?.[key]
    return typeof value === 'string' ? value : undefined
  }
}
