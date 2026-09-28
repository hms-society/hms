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
import { CollaboratorProfile } from '../../identity/domain/structures'
import type { CollaboratorProfile as CollaboratorProfileValue } from '../../identity/domain/structures'
import type { Broker, DatetimeProvider, IdProvider } from '../../shared/interfaces'
import { CaseChecklistGateDecision, LegalCaseStatus } from '../domain/structures'
import { LegalCaseDocumentGenerationError } from '../domain/errors/legal-case-document-generation-error'
import { LegalCaseNotFoundError } from '../domain/errors/legal-case-not-found-error'
import type { LegalCase } from '../domain/entities'
import type { LegalCasesRepository } from '../interfaces'

type Request = {
  readonly caseId: string
  readonly documentId: string
  readonly sourceDocumentVersionId: string
  readonly requestedByCollaboratorId: string
  readonly requestedByCollaboratorProfile: CollaboratorProfileValue
  readonly instructions: string
}

type Response = { documentGenerationId: string; documentId: string }

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

    const [generation, sourceVersion, latestVersion] = await Promise.all([
      this.generations.findLatestByDocumentId(request.documentId),
      this.versions.findById(request.sourceDocumentVersionId),
      this.versions.findLatestByDocumentId(request.documentId),
    ])
    if (!generation) throw new LegalCaseNotFoundError()
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
    if (
      generation.status === DocumentGenerationStatus.Pending ||
      generation.status === DocumentGenerationStatus.Running
    ) {
      throw new LegalCaseDocumentGenerationError(
        'A peça já possui uma geração em andamento.',
      )
    }

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

  private async assertCaseAccess(request: Request, caseId: string): Promise<void> {
    if (request.requestedByCollaboratorProfile === CollaboratorProfile.Admin) return
    const assignedCases = await this.cases.listByTeamMember(
      request.requestedByCollaboratorId,
    )
    if (!assignedCases.some((item) => item.id === caseId)) {
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
}
