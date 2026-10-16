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
import type { CollaboratorProfile as CollaboratorProfileValue } from '#shared/domain/structures'
import type { Broker, DatetimeProvider, IdProvider } from '../../shared/interfaces'
import {
  CaseChecklistGateDecision,
  LegalCaseLifecycleStatus,
  LegalCaseStatus,
} from '../domain/structures'
import { LegalCaseDocumentGenerationError } from '../domain/errors/legal-case-document-generation-error'
import { LegalCaseNotFoundError } from '../domain/errors/legal-case-not-found-error'
import type { LegalCase } from '../domain/entities'
import type { LegalCasesRepository } from '../interfaces'
import type { CaseAccessProvider } from '../interfaces'
import { CaseAccessIntent } from '../domain/structures'

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
type PackageDocument = Awaited<
  ReturnType<PackageDocumentsRepository['findByDocumentPackageId']>
>[number]
type Generation = NonNullable<
  Awaited<ReturnType<DocumentGenerationsRepository['findLatestByDocumentId']>>
>

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
    private readonly caseAccessProvider: CaseAccessProvider,
  ) {}

  async execute(request: Request): Promise<Response> {
    const legalCase = await this.cases.findById(request.caseId)
    if (!legalCase) throw new LegalCaseNotFoundError()
    await this.caseAccessProvider.authorize({
      caseId: legalCase.id,
      actorId: request.requestedByCollaboratorId,
      intent: CaseAccessIntent.WriteContent,
    })
    this.assertDossierReady(legalCase)
    const packageDocument = await this.findPackageDocument(legalCase, request.documentId)
    const previousGeneration = await this.findRetryableGeneration(
      legalCase,
      packageDocument,
      request.documentId,
    )
    return this.publishRetry(request, previousGeneration)
  }

  private async findPackageDocument(
    legalCase: LegalCase,
    documentId: string,
  ): Promise<PackageDocument> {
    const documentPackage = await this.packages.findByContext({
      type: 'case',
      caseId: legalCase.id,
    })
    if (!documentPackage) throw new LegalCaseNotFoundError()
    const packageDocuments = await this.packageDocuments.findByDocumentPackageId(
      documentPackage.id,
    )
    const packageDocument = packageDocuments.find(
      (item) => item.documentId === documentId,
    )
    if (!packageDocument) throw new LegalCaseNotFoundError()
    return packageDocument
  }

  private async findRetryableGeneration(
    legalCase: LegalCase,
    packageDocument: PackageDocument,
    documentId: string,
  ): Promise<Generation> {
    const previousGeneration = await this.generations.findLatestByDocumentId(documentId)
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
    return previousGeneration
  }

  private async publishRetry(
    request: Request,
    previousGeneration: Generation,
  ): Promise<Response> {
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

  private assertDossierReady(legalCase: LegalCase): void {
    const approvedGate =
      legalCase.checklistGate.decision === CaseChecklistGateDecision.Approved ||
      legalCase.checklistGate.decision === CaseChecklistGateDecision.ApprovedWithException
    const workflowStage = legalCase.workflowStage
    const productionStage =
      legalCase.lifecycleStatus !== LegalCaseLifecycleStatus.Closed &&
      (workflowStage === LegalCaseStatus.ReadyForLegalProduction ||
        workflowStage === LegalCaseStatus.LegalProduction)

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
