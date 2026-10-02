import type { UseCase } from '#shared/interfaces/use-case'
import { DocumentGenerationRequestedEvent } from '../../document-production/domain/events'
import {
  DocumentGenerationStatus,
  type DocumentGenerationSource,
} from '../../document-production/domain/structures'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import { CancelDocumentGenerationUseCase } from '../../document-production/use-cases/cancel-document-generation-use-case'
import { CollaboratorProfile } from '../../identity/domain/structures'
import type { CollaboratorProfile as CollaboratorProfileValue } from '../../identity/domain/structures'
import type { Broker, DatetimeProvider, IdProvider } from '../../shared/interfaces'
import { CaseChecklistGateDecision, LegalCaseStatus } from '../domain/structures'
import { LegalCaseDocumentGenerationError } from '../domain/errors/legal-case-document-generation-error'
import { LegalCaseNotFoundError } from '../domain/errors/legal-case-not-found-error'
import type { LegalCase } from '../domain/entities'
import type { LegalCasesRepository } from '../interfaces'

type Request = {
  caseId: string
  documentId: string
  requestedByCollaboratorId: string
  requestedByCollaboratorProfile: CollaboratorProfileValue
}

type Response = {
  documentGenerationId: string
  documentId: string
}

export class RetryLegalCaseDocumentGenerationUseCase
  implements UseCase<Request, Response>
{
  constructor(
    private readonly cases: LegalCasesRepository,
    private readonly packages: DocumentPackagesRepository,
    private readonly packageDocuments: PackageDocumentsRepository,
    private readonly generations: DocumentGenerationsRepository,
    private readonly broker: Broker,
    private readonly datetime: DatetimeProvider,
    private readonly ids: IdProvider,
  ) {}

  async execute(request: Request): Promise<Response> {
    const legalCase = await this.cases.findById(request.caseId)
    if (!legalCase) throw new LegalCaseNotFoundError()
    await this.assertCaseAccess(request, legalCase.id)
    this.assertDossierReady(legalCase)

    const documentPackage = await this.packages.findByContext({
      type: 'case',
      caseId: legalCase.id,
    })
    if (!documentPackage) throw new LegalCaseNotFoundError()

    const packageDocuments = await this.packageDocuments.findByDocumentPackageId(
      documentPackage.id,
    )
    const packageDocument = packageDocuments.find(
      ({ documentId }) => documentId === request.documentId,
    )
    if (!packageDocument) throw new LegalCaseNotFoundError()

    const previousGeneration = await this.generations.findLatestByDocumentId(
      request.documentId,
    )
    if (
      previousGeneration?.source.type !== 'case' ||
      previousGeneration.source.id !== legalCase.id ||
      previousGeneration.documentSpecificationVersionId !==
        packageDocument.documentSpecificationId
    ) {
      throw new LegalCaseNotFoundError()
    }
    if (previousGeneration.status === DocumentGenerationStatus.Completed) {
      throw new LegalCaseDocumentGenerationError(
        'Esta peça já possui uma geração concluída e não pode ser gerada novamente.',
      )
    }

    if (
      previousGeneration.status === DocumentGenerationStatus.Pending ||
      previousGeneration.status === DocumentGenerationStatus.Running
    ) {
      const cancelGeneration = new CancelDocumentGenerationUseCase(
        this.generations,
        this.datetime,
        this.broker,
      )
      await cancelGeneration.execute({ documentGenerationId: previousGeneration.id })
    }

    const documentGenerationId = this.ids.generate()
    const occurredAt = this.datetime.now()
    const instructions = this.getGenerationInstructions(previousGeneration.source)
    await this.broker.publish(
      new DocumentGenerationRequestedEvent({
        documentGenerationId,
        documentId: request.documentId,
        documentSpecificationVersionId: previousGeneration.documentSpecificationVersionId,
        requestedByCollaboratorId: request.requestedByCollaboratorId,
        ...(instructions ? { instructions } : {}),
        source: previousGeneration.source,
        occurredAt,
      }),
    )

    return { documentGenerationId, documentId: request.documentId }
  }

  private async assertCaseAccess(request: Request, caseId: string): Promise<void> {
    if (request.requestedByCollaboratorProfile === CollaboratorProfile.Admin) return

    const assignedCases = await this.cases.listByTeamMember(
      request.requestedByCollaboratorId,
    )
    if (!assignedCases.some((assignedCase) => assignedCase.id === caseId)) {
      throw new LegalCaseNotFoundError()
    }
  }

  private assertDossierReady(legalCase: LegalCase): void {
    const approvedGate =
      legalCase.checklistGate.decision === CaseChecklistGateDecision.Approved ||
      legalCase.checklistGate.decision === CaseChecklistGateDecision.ApprovedWithException
    const productionStage =
      legalCase.status === LegalCaseStatus.ReadyForLegalProduction ||
      legalCase.status === LegalCaseStatus.LegalProduction

    if (!approvedGate || !productionStage || !legalCase.dossierGate.homologatedAt) {
      throw new LegalCaseDocumentGenerationError(
        'A geração exige o dossiê documental aprovado e a liberação da produção jurídica.',
      )
    }
  }

  private getGenerationInstructions(
    source: DocumentGenerationSource,
  ): string | undefined {
    const instructions = source.data.generationInstructions
    return typeof instructions === 'string' && instructions.trim()
      ? instructions.trim()
      : undefined
  }
}
