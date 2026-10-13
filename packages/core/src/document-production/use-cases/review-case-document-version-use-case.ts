import type {
  CaseMembersRepository,
  LegalCasesRepository,
} from '../../case-management/interfaces'
import type { CollaboratorProfile } from '../../identity/domain/structures'
import { DocumentVersionReviewAccessDeniedError } from '../domain/errors'
import type { DocumentVersion } from '../domain/entities'
import type { DocumentVersionStatus } from '../domain/structures'
import type { DocumentVersionsRepository } from '../interfaces'

type Request = {
  caseId: string
  documentId: string
  documentVersionId: string
  reviewedByCollaboratorId: string
  reviewedByCollaboratorProfile: CollaboratorProfile
  decision: Extract<DocumentVersionStatus, 'approved' | 'rejected'>
  rejectionReason?: string
  reviewedAt: Date
}

export class ReviewCaseDocumentVersionUseCase {
  constructor(
    private readonly versionsRepository: DocumentVersionsRepository,
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly caseMembersRepository: CaseMembersRepository,
  ) {}

  async execute(request: Request): Promise<DocumentVersion> {
    const version = await this.versionsRepository.findById(request.documentVersionId)
    if (!version || version.documentId !== request.documentId) {
      throw new Error('A versão documental não foi encontrada.')
    }
    if (version.createdByCollaboratorId === request.reviewedByCollaboratorId) {
      throw new DocumentVersionReviewAccessDeniedError()
    }

    const isPrivilegedReviewer =
      request.reviewedByCollaboratorProfile === 'admin' ||
      request.reviewedByCollaboratorProfile === 'supervisor'
    const legalCase = await this.legalCasesRepository.findById(request.caseId)
    const isCaseMember = legalCase
      ? (
          await this.caseMembersRepository.findActiveCollaboratorIdsByCaseId(
            request.caseId,
            [request.reviewedByCollaboratorId],
          )
        ).includes(request.reviewedByCollaboratorId)
      : false
    if (!isPrivilegedReviewer && !isCaseMember) {
      throw new DocumentVersionReviewAccessDeniedError()
    }

    const reviewedVersion = await this.versionsRepository.review(
      request.documentVersionId,
      request.decision,
      request.reviewedByCollaboratorId,
      request.reviewedAt,
      request.rejectionReason,
    )
    if (!reviewedVersion)
      throw new Error('A versão documental não está disponível para revisão.')
    return reviewedVersion
  }
}
