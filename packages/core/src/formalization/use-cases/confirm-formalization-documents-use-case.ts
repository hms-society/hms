import type { Broker, DatetimeProvider } from '../../shared/interfaces'
import type {
  DocumentGeneration,
  DocumentVersion,
} from '../../document-production/domain/entities'
import { DocumentVersionStatus } from '../../document-production/domain/structures'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
  DocumentsRepository,
} from '../../document-production/interfaces'
import type { Formalization } from '../domain/entities'
import {
  FormalizationConfirmationError,
  FormalizationDocumentStaleError,
  FormalizationNotFoundError,
  FormalizationVersionConflictError,
} from '../domain/errors'
import type { FormalizationActor } from '../domain/structures'
import type {
  FormalizationDocumentConfirmationTransaction,
  FormalizationSignatureConfigurationRepository,
  FormalizationsRepository,
} from '../interfaces'
import { FormalizationSignatureConfigurationUseCase } from './formalization-signature-configuration-use-case'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly expectedVersion: number
}
export class ConfirmFormalizationDocumentsUseCase extends FormalizationSignatureConfigurationUseCase<
  Request,
  Formalization
> {
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly versionsRepository: DocumentVersionsRepository,
    private readonly generationsRepository: DocumentGenerationsRepository,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly documentsRepository?: DocumentsRepository,
    private readonly confirmationTransaction?: FormalizationDocumentConfirmationTransaction,
    private readonly signatureConfigurationRepository?: FormalizationSignatureConfigurationRepository,
    private readonly broker?: Broker,
  ) {
    super()
  }

  async execute(request: Request): Promise<Formalization> {
    const formalization = await this.formalizationsRepository.findById(
      request.formalizationId,
    )

    if (!formalization) throw new FormalizationNotFoundError()
    this.assertAccess(formalization.assignedLawyerId, request)
    if (formalization.documentsConfirmedAt) return formalization
    this.assertWritable(formalization)
    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'formalization',
      formalizationId: formalization.id,
    })
    if (!documentPackage) {
      throw new FormalizationConfirmationError(
        'Selecione ao menos um documento antes de confirmar.',
      )
    }
    const packageDocuments =
      await this.packageDocumentsRepository.findByDocumentPackageId(documentPackage.id)
    if (packageDocuments.length === 0) {
      throw new FormalizationConfirmationError(
        'Selecione ao menos um documento antes de confirmar.',
      )
    }

    const versions = await this.versionsRepository.findByDocumentIds(
      packageDocuments.map((document) => document.documentId),
    )
    const documents = this.documentsRepository
      ? await this.documentsRepository.findByIds(
          packageDocuments.map((document) => document.documentId),
        )
      : []
    const documentsById = new Map(documents.map((document) => [document.id, document]))
    const generations = await this.loadGenerations(versions)
    for (const document of packageDocuments) {
      const documentVersions = versions.filter(
        (version) => version.documentId === document.documentId,
      )
      const selectedVersionId = documentsById.get(document.documentId)?.currentVersionId
      const latest = selectedVersionId
        ? documentVersions.find((version) => version.id === selectedVersionId)
        : documentVersions.reduce<(typeof documentVersions)[number] | undefined>(
            (current, version) =>
              !current || version.versionNumber > current.versionNumber
                ? version
                : current,
            undefined,
          )
      if (!latest || latest.status !== DocumentVersionStatus.Approved) {
        throw new FormalizationConfirmationError(
          'Gere e revise todos os documentos antes de confirmar o pacote.',
        )
      }
      if (!this.isFreshVersion(latest.id, documentVersions, generations, formalization)) {
        throw new FormalizationDocumentStaleError()
      }
    }

    const now = this.datetimeProvider.now()
    if (this.confirmationTransaction) {
      const result = await this.confirmationTransaction.confirm({
        formalizationId: formalization.id,
        expectedVersion: request.expectedVersion,
        actorId: request.actorId,
        occurredAt: now,
      })
      if (this.signatureConfigurationRepository && this.broker) {
        await this.publishPendingPreviewBatch(
          formalization.id,
          result.pendingPreviewIds,
          now,
          this.signatureConfigurationRepository,
          this.broker,
        )
      }
      return result.formalization
    }
    const confirmed = await this.formalizationsRepository.replace({
      formalizationId: formalization.id,
      expectedVersion: request.expectedVersion,
      changes: {
        documentsConfirmedAt: now,
        documentsConfirmedByCollaboratorId: request.actorId,
        documentsConfirmedRevision: formalization.contractFormRevision,
      },
    })
    if (!confirmed) throw new FormalizationVersionConflictError()
    return confirmed
  }

  private async loadGenerations(
    versions: readonly DocumentVersion[],
  ): Promise<readonly DocumentGeneration[]> {
    const generationIds = [
      ...new Set(
        versions.flatMap((version) =>
          version.documentGenerationId ? [version.documentGenerationId] : [],
        ),
      ),
    ]
    const generations = await Promise.all(
      generationIds.map((generationId) =>
        this.generationsRepository.findById(generationId),
      ),
    )
    return generations.filter((generation): generation is DocumentGeneration =>
      Boolean(generation),
    )
  }

  private isFreshVersion(
    versionId: string,
    versions: readonly DocumentVersion[],
    generations: readonly DocumentGeneration[],
    formalization: Formalization,
  ): boolean {
    const versionsById = new Map(versions.map((version) => [version.id, version]))
    let version = versionsById.get(versionId)
    while (version) {
      if (version.documentGenerationId) {
        const generation = generations.find(
          (candidate) => candidate.id === version?.documentGenerationId,
        )
        const data = generation?.source.data as {
          readonly formalization?: {
            readonly id?: string
            readonly contractFormRevision?: number
          }
        }
        return Boolean(
          generation?.source.type === 'formalization' &&
            generation.source.id === formalization.id &&
            data.formalization?.id === formalization.id &&
            data.formalization.contractFormRevision ===
              formalization.contractFormRevision,
        )
      }
      version = version.sourceDocumentVersionId
        ? versionsById.get(version.sourceDocumentVersionId)
        : undefined
    }
    return false
  }
}
