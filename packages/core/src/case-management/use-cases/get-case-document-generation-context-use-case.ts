import type { UseCase } from '#shared/interfaces/use-case'
import type { DocumentValidationsRepository } from '../../document-engine/interfaces'
import { DocumentValidationStatus } from '../../document-engine/domain/structures'
import type { DocumentSpecificationsRepository } from '../../document-production/interfaces'
import {
  DocumentGenerationMoment,
  DocumentSpecificationStatus,
} from '../../document-production/domain/structures'
import { LegalCaseNotFoundError } from '../domain/errors'
import {
  CaseChecklistGateDecision,
  CaseChecklistItemStatus,
  LegalCaseStatus,
} from '../domain/structures'
import type { CaseChecklistItemsRepository, LegalCasesRepository } from '../interfaces'

type Request = { caseId: string; collaboratorId: string; isAdmin?: boolean }

export type CaseDocumentGenerationContext = {
  case: { id: string; publicCode: string; title: string }
  models: readonly { id: string; name: string; description: string }[]
  documents: readonly {
    id: string
    checklistItemId: string
    label: string
    fileName: string
    validationStatus: typeof CaseChecklistItemStatus.Validated
    reviewedAt: Date
    reviewedBy: string
  }[]
  checklistGateDecision?: string
  canGenerate: boolean
}

export class GetCaseDocumentGenerationContextUseCase
  implements UseCase<Request, CaseDocumentGenerationContext>
{
  constructor(
    private readonly cases: LegalCasesRepository,
    private readonly checklistItems: CaseChecklistItemsRepository,
    private readonly validations: DocumentValidationsRepository,
    private readonly specifications: DocumentSpecificationsRepository,
  ) {}

  async execute(request: Request): Promise<CaseDocumentGenerationContext> {
    const legalCase = await this.cases.findById(request.caseId)
    if (!legalCase) throw new LegalCaseNotFoundError()

    if (!request.isAdmin) {
      const assignedCases = await this.cases.listByTeamMember(request.collaboratorId)
      if (!assignedCases.some((assignedCase) => assignedCase.id === request.caseId)) {
        throw new LegalCaseNotFoundError()
      }
    }

    const [checklistItems, validationPage, specificationPage] = await Promise.all([
      this.checklistItems.listByCaseId(legalCase.id),
      this.validations.list({
        caseId: legalCase.id,
        status: DocumentValidationStatus.Valid,
      }),
      this.specifications.list({
        moment: DocumentGenerationMoment.LegalProduction,
        status: DocumentSpecificationStatus.Available,
        page: 1,
        pageSize: 100,
      }),
    ])

    const documents = checklistItems.flatMap((item) => {
      if (
        item.status !== CaseChecklistItemStatus.Validated ||
        !item.documentFileId ||
        !item.validatedAt ||
        !item.validatedBy
      )
        return []
      const validation = validationPage.find(
        (candidate) =>
          candidate.id === item.documentFileId &&
          candidate.status === DocumentValidationStatus.Valid &&
          candidate.reviewedAt &&
          candidate.reviewedBy &&
          candidate.checklistLink?.caseId === legalCase.id &&
          candidate.checklistLink.checklistItemId === item.id,
      )
      const reviewedAt = validation?.reviewedAt
      const reviewedBy = validation?.reviewedBy
      if (!validation || !reviewedAt || !reviewedBy) return []
      return [
        {
          id: validation.id,
          checklistItemId: item.id,
          label: item.title,
          fileName: validation.fileName,
          validationStatus: CaseChecklistItemStatus.Validated,
          reviewedAt,
          reviewedBy,
        },
      ]
    })

    const models = specificationPage.items
      .filter(
        (specification) =>
          specification.application.scope === 'global' ||
          (specification.application.legalAreaIds.includes(legalCase.legalAreaId) &&
            (
              specification.application.legalTopicIdsByArea[legalCase.legalAreaId] ?? []
            ).includes(legalCase.legalTopicId)),
      )
      .map(({ documentSpecificationId, name, description }) => ({
        id: documentSpecificationId,
        name,
        description,
      }))

    return {
      case: {
        id: legalCase.id,
        publicCode: legalCase.publicCode,
        title: legalCase.title,
      },
      models,
      documents,
      checklistGateDecision: legalCase.checklistGate.decision,
      canGenerate:
        (legalCase.checklistGate.decision === CaseChecklistGateDecision.Approved ||
          legalCase.checklistGate.decision ===
            CaseChecklistGateDecision.ApprovedWithException) &&
        (legalCase.status === LegalCaseStatus.ReadyForLegalProduction ||
          legalCase.status === LegalCaseStatus.LegalProduction) &&
        Boolean(legalCase.dossierGate.homologatedAt),
    }
  }
}
