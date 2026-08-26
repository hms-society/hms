import type { DatetimeProvider, UseCase } from '../../shared/interfaces'
import type { DocumentGeneration } from '../../document-production/domain/entities'
import { DocumentVersionStatus } from '../../document-production/domain/structures'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import type { Formalization } from '../domain/entities'
import {
  FormalizationConfirmationError,
  FormalizationDocumentStaleError,
  FormalizationNotFoundError,
  FormalizationVersionConflictError,
} from '../domain/errors'
import type { FormalizationActor } from '../domain/structures'
import type { FormalizationsRepository } from '../interfaces'
import { FormalizationActorAuthorization } from './formalization-actor-authorization'
import { FormalizationDocumentGuard } from './formalization-document-guard'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly expectedVersion: number
}

export class ConfirmFormalizationDocumentsUseCase
  implements UseCase<Request, Formalization>
{
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly versionsRepository: DocumentVersionsRepository,
    private readonly generationsRepository: DocumentGenerationsRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<Formalization> {
    const formalization = await this.formalizationsRepository.findById(request.formalizationId)
    if (!formalization) throw new FormalizationNotFoundError()
    FormalizationActorAuthorization.assertAccess(formalization.assignedLawyerId, request)
    if (formalization.documentsConfirmedAt) return formalization
    FormalizationDocumentGuard.assertWritable(formalization)
    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'formalization',
      formalizationId: formalization.id,
    })
    if (!documentPackage) {
      throw new FormalizationConfirmationError('Selecione ao menos um documento antes de confirmar.')
    }
    const packageDocuments = await this.packageDocumentsRepository.findByDocumentPackageId(
      documentPackage.id,
    )
    if (packageDocuments.length === 0) {
      throw new FormalizationConfirmationError('Selecione ao menos um documento antes de confirmar.')
    }
    const versions = await this.versionsRepository.findByDocumentIds(
      packageDocuments.map((document) => document.documentId),
    )
    const generations = await this.loadGenerations(versions)
    for (const document of packageDocuments) {
      const documentVersions = versions.filter((version) => version.documentId === document.documentId)
      const latest = documentVersions.reduce<typeof documentVersions[number] | undefined>(
        (current, version) =>
          !current || version.versionNumber > current.versionNumber ? version : current,
        undefined,
      )
      if (
        !latest ||
        (latest.status !== DocumentVersionStatus.Approved &&
          latest.status !== DocumentVersionStatus.Rejected)
      ) {
        throw new FormalizationConfirmationError(
          'Gere e revise todos os documentos antes de confirmar o pacote.',
        )
      }
      if (!this.isFreshVersion(latest.id, documentVersions, generations, formalization)) {
        throw new FormalizationDocumentStaleError()
      }
    }
    const now = this.datetimeProvider.now()
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
    versions: readonly import('../../document-production/domain/entities').DocumentVersion[],
  ): Promise<readonly DocumentGeneration[]> {
    const generationIds = [
      ...new Set(
        versions.flatMap((version) =>
          version.documentGenerationId ? [version.documentGenerationId] : [],
        ),
      ),
    ]
    const generations = await Promise.all(
      generationIds.map((generationId) => this.generationsRepository.findById(generationId)),
    )
    return generations.filter(
      (generation): generation is DocumentGeneration => Boolean(generation),
    )
  }

  private isFreshVersion(
    versionId: string,
    versions: readonly import('../../document-production/domain/entities').DocumentVersion[],
    generations: readonly DocumentGeneration[],
    formalization: Formalization,
  ): boolean {
    const versionsById = new Map(versions.map((version) => [version.id, version]))
    let version = versionsById.get(versionId)
    while (version) {
      if (version.documentGenerationId) {
        const generation = generations.find((candidate) => candidate.id === version?.documentGenerationId)
        const data = generation?.source.data as {
          readonly formalization?: { readonly id?: string; readonly contractFormRevision?: number }
        }
        return Boolean(
          generation?.source.type === 'formalization' &&
            generation.source.id === formalization.id &&
            data.formalization?.id === formalization.id &&
            data.formalization.contractFormRevision === formalization.contractFormRevision,
        )
      }
      version = version.sourceDocumentVersionId
        ? versionsById.get(version.sourceDocumentVersionId)
        : undefined
    }
    return false
  }
}
