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
import type {
  CaseAccessProvider,
  CaseChecklistItemsRepository,
  LegalCasesRepository,
} from '../interfaces'
import { CaseAccessIntent } from '../domain/structures'
import type { LegalCase } from '../domain/entities'
import type { DocumentValidationRecord } from '../../document-engine/domain/entities'
import type { DocumentSpecificationListRecord } from '../../document-production/domain/structures'

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
    private readonly caseAccessProvider: CaseAccessProvider,
  ) {}

  async execute(request: Request): Promise<CaseDocumentGenerationContext> {
    const legalCase = await this.cases.findById(request.caseId)
    if (!legalCase) throw new LegalCaseNotFoundError()

    await this.caseAccessProvider.authorize({
      caseId: legalCase.id,
      actorId: request.collaboratorId,
      intent: CaseAccessIntent.ReadDocument,
    })

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

    const documents = this.projectValidatedDocuments(
      checklistItems,
      validationPage,
      legalCase.id,
    )
    const models = this.projectCompatibleModels(specificationPage.items, legalCase)

    return {
      case: {
        id: legalCase.id,
        publicCode: legalCase.publicCode,
        title: legalCase.title,
      },
      models,
      documents,
      checklistGateDecision: legalCase.checklistGate.decision,
      canGenerate: this.canGenerate(legalCase),
    }
  }

  private projectValidatedDocuments(
    items: Awaited<ReturnType<CaseChecklistItemsRepository['listByCaseId']>>,
    validations: readonly DocumentValidationRecord[],
    caseId: string,
  ): CaseDocumentGenerationContext['documents'] {
    const documents: CaseDocumentGenerationContext['documents'][number][] = []
    for (const item of items) {
      if (!this.hasValidatedFile(item)) continue
      const validation = this.findReviewedValidation(item, validations, caseId)
      if (!validation?.reviewedAt || !validation.reviewedBy) continue
      documents.push({
        id: validation.id,
        checklistItemId: item.id,
        label: item.title,
        fileName: validation.fileName,
        validationStatus: CaseChecklistItemStatus.Validated,
        reviewedAt: validation.reviewedAt,
        reviewedBy: validation.reviewedBy,
      })
    }
    return documents
  }

  private hasValidatedFile(
    item: Awaited<ReturnType<CaseChecklistItemsRepository['listByCaseId']>>[number],
  ): boolean {
    return (
      item.status === CaseChecklistItemStatus.Validated &&
      Boolean(item.documentFileId && item.validatedAt && item.validatedBy)
    )
  }

  private findReviewedValidation(
    item: Awaited<ReturnType<CaseChecklistItemsRepository['listByCaseId']>>[number],
    validations: readonly DocumentValidationRecord[],
    caseId: string,
  ): DocumentValidationRecord | undefined {
    return validations.find(
      (candidate) =>
        candidate.id === item.documentFileId &&
        candidate.status === DocumentValidationStatus.Valid &&
        Boolean(candidate.reviewedAt && candidate.reviewedBy) &&
        candidate.checklistLink?.caseId === caseId &&
        candidate.checklistLink.checklistItemId === item.id,
    )
  }

  private projectCompatibleModels(
    specifications: readonly DocumentSpecificationListRecord[],
    legalCase: LegalCase,
  ): CaseDocumentGenerationContext['models'] {
    return specifications
      .filter((specification) => this.isCompatibleSpecification(specification, legalCase))
      .map(({ documentSpecificationId, name, description }) => ({
        id: documentSpecificationId,
        name,
        description,
      }))
  }

  private isCompatibleSpecification(
    specification: DocumentSpecificationListRecord,
    legalCase: LegalCase,
  ): boolean {
    if (specification.application.scope === 'global') return true
    return (
      specification.application.legalAreaIds.includes(legalCase.legalAreaId) &&
      (
        specification.application.legalTopicIdsByArea[legalCase.legalAreaId] ?? []
      ).includes(legalCase.legalTopicId)
    )
  }

  private canGenerate(legalCase: LegalCase): boolean {
    const approvedGate =
      legalCase.checklistGate.decision === CaseChecklistGateDecision.Approved ||
      legalCase.checklistGate.decision === CaseChecklistGateDecision.ApprovedWithException
    const productionStage =
      legalCase.status === LegalCaseStatus.ReadyForLegalProduction ||
      legalCase.status === LegalCaseStatus.LegalProduction
    return approvedGate && productionStage && Boolean(legalCase.dossierGate.homologatedAt)
  }
}
