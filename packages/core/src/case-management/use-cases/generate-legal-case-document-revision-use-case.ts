import type { UseCase } from '#shared/interfaces/use-case'
import { DocumentGenerationRequestedEvent } from '../../document-production/domain/events'
import {
  DocumentGenerationStatus,
  type DocumentGenerationSource,
} from '../../document-production/domain/structures'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
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
  readonly caseId: string
  readonly documentId: string
  readonly sourceDocumentVersionId: string
  readonly requestedByCollaboratorId: string
  readonly requestedByCollaboratorProfile: CollaboratorProfileValue
  readonly instructions: string
}

type Response = { documentGenerationId: string; documentId: string }
type PackageDocument = Awaited<
  ReturnType<PackageDocumentsRepository['findByDocumentPackageId']>
>[number]
type Generation = NonNullable<
  Awaited<ReturnType<DocumentGenerationsRepository['findLatestByDocumentId']>>
>
type DocumentVersion = NonNullable<
  Awaited<ReturnType<DocumentVersionsRepository['findById']>>
>

export class GenerateLegalCaseDocumentRevisionUseCase
  implements UseCase<Request, Response>
{
  constructor(
    private readonly cases: LegalCasesRepository,
    private readonly packages: DocumentPackagesRepository,
    private readonly packageDocuments: PackageDocumentsRepository,
    private readonly generations: DocumentGenerationsRepository,
    private readonly versions: DocumentVersionsRepository,
    private readonly broker: Broker,
    private readonly datetime: DatetimeProvider,
    private readonly ids: IdProvider,
    private readonly caseAccessProvider: CaseAccessProvider,
  ) {}

  async execute(request: Request): Promise<Response> {
    const instructions = request.instructions.trim()
    if (!instructions || instructions.length > 4000) {
      throw new LegalCaseDocumentGenerationError(
        'Informe instruções de até 4.000 caracteres para a nova versão.',
      )
    }
    const legalCase = await this.cases.findById(request.caseId)
    if (!legalCase) throw new LegalCaseNotFoundError()
    await this.caseAccessProvider.authorize({
      caseId: legalCase.id,
      actorId: request.requestedByCollaboratorId,
      intent: CaseAccessIntent.WriteContent,
    })
    this.assertDossierReady(legalCase)

    const packageDocument = await this.findPackageDocument(legalCase, request.documentId)
    const revisionBase = await this.findRevisionBase(request, legalCase, packageDocument)
    return this.publishRevision(request, instructions, packageDocument, revisionBase)
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

  private async findRevisionBase(
    request: Request,
    legalCase: LegalCase,
    packageDocument: PackageDocument,
  ): Promise<{ generation: Generation; sourceVersion: DocumentVersion }> {
    const [generation, sourceVersion, latestVersion] = await Promise.all([
      this.generations.findLatestByDocumentId(request.documentId),
      this.versions.findById(request.sourceDocumentVersionId),
      this.versions.findLatestByDocumentId(request.documentId),
    ])
    if (!generation) throw new LegalCaseNotFoundError()
    this.assertRevisionBaseIsValid(
      request,
      legalCase,
      packageDocument,
      generation,
      sourceVersion,
      latestVersion,
    )
    if (
      generation.status === DocumentGenerationStatus.Pending ||
      generation.status === DocumentGenerationStatus.Running
    ) {
      throw new LegalCaseDocumentGenerationError(
        'A peça já possui uma geração em andamento.',
      )
    }
    return { generation, sourceVersion }
  }

  private assertRevisionBaseIsValid(
    request: Request,
    legalCase: LegalCase,
    packageDocument: PackageDocument,
    generation: Generation,
    sourceVersion: DocumentVersion | null | undefined,
    latestVersion: DocumentVersion | null | undefined,
  ): asserts sourceVersion is DocumentVersion {
    if (
      generation.source.type !== 'case' ||
      generation.source.id !== legalCase.id ||
      generation.documentSpecificationVersionId !==
        packageDocument.documentSpecificationId ||
      !sourceVersion ||
      sourceVersion.documentId !== request.documentId ||
      !sourceVersion.content ||
      !latestVersion
    ) {
      throw new LegalCaseNotFoundError()
    }
  }

  private async publishRevision(
    request: Request,
    instructions: string,
    packageDocument: PackageDocument,
    revisionBase: { generation: Generation; sourceVersion: DocumentVersion },
  ): Promise<Response> {
    const { generation, sourceVersion } = revisionBase
    const documentGenerationId = this.ids.generate()
    const occurredAt = this.datetime.now()
    const source: DocumentGenerationSource = {
      ...generation.source,
      data: {
        ...generation.source.data,
        baseDocumentVersionId: sourceVersion.id,
        baseDocumentContent: sourceVersion.content,
        generationInstructions: instructions,
        revisionOfGenerationId: generation.id,
      },
    }
    await this.broker.publish(
      new DocumentGenerationRequestedEvent({
        documentGenerationId,
        documentId: request.documentId,
        documentSpecificationVersionId: packageDocument.documentSpecificationId,
        requestedByCollaboratorId: request.requestedByCollaboratorId,
        instructions,
        source,
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
}
