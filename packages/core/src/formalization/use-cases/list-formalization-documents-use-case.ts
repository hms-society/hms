import type {
  DocumentGeneration,
  DocumentVersion,
} from '../../document-production/domain/entities'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import { FormalizationUseCase } from './formalization-use-case'
import type { FormalizationDocumentListItem } from '../domain/structures'
import { FormalizationNotFoundError } from '../domain/errors'
import type { FormalizationActor } from '../domain/structures'
import type { FormalizationsRepository } from '../interfaces'

type Request = FormalizationActor & {
  readonly formalizationId: string
}

export class ListFormalizationDocumentsUseCase extends FormalizationUseCase<
  Request,
  readonly FormalizationDocumentListItem[]
> {
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly documentsRepository: DocumentsRepository,
    private readonly generationsRepository: DocumentGenerationsRepository,
    private readonly versionsRepository: DocumentVersionsRepository,
  ) {
    super()
  }

  async execute(request: Request): Promise<readonly FormalizationDocumentListItem[]> {
    const formalization = await this.formalizationsRepository.findById(
      request.formalizationId,
    )

    if (!formalization) throw new FormalizationNotFoundError()
    this.assertAccess(formalization.assignedLawyerId, request)
    this.assertFormClosed(formalization)
    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'formalization',
      formalizationId: formalization.id,
    })
    if (!documentPackage) return []

    const packageDocuments =
      await this.packageDocumentsRepository.findByDocumentPackageId(documentPackage.id)
    if (packageDocuments.length === 0) return []

    const documents = await this.documentsRepository.findByIds(
      packageDocuments.map((document) => document.documentId),
    )
    const documentsById = new Map(documents.map((document) => [document.id, document]))
    const versions = await this.versionsRepository.findByDocumentIds(
      packageDocuments.map((document) => document.documentId),
    )
    const versionsByDocumentId = new Map<string, (typeof versions)[number][]>()
    for (const version of versions) {
      const current = versionsByDocumentId.get(version.documentId) ?? []
      current.push(version)
      versionsByDocumentId.set(version.documentId, current)
    }
    const generations = await this.generationsRepository.findLatestByDocumentIds(
      packageDocuments.map((document) => document.documentId),
    )
    const generationsByDocumentId = new Map(
      generations.map((generation) => [generation.documentId, generation]),
    )

    return packageDocuments.flatMap((packageDocument) => {
      const document = documentsById.get(packageDocument.documentId)
      if (!document) return []
      const documentVersions = versionsByDocumentId.get(document.id) ?? []
      const latestVersion = documentVersions.reduce<
        (typeof documentVersions)[number] | undefined
      >(
        (latest, version) =>
          !latest || version.versionNumber > latest.versionNumber ? version : latest,
        undefined,
      )
      const generation = generationsByDocumentId.get(document.id)
      return [
        {
          id: document.id,
          title: document.title,
          currentVersionId: document.currentVersionId,
          generationStatus: generation?.status,
          isFresh: latestVersion
            ? this.isFreshVersion(
                latestVersion.id,
                documentVersions,
                generations,
                formalization.id,
                formalization.contractFormRevision,
              )
            : false,
          versions: documentVersions
            .sort((first, second) => second.versionNumber - first.versionNumber)
            .map((version) => ({
              id: version.id,
              versionNumber: version.versionNumber,
              source: version.source,
              status: version.status,
              pendingMarkersCount: version.pendingMarkers.length,
              createdByCollaboratorId: version.createdByCollaboratorId,
              createdAt: version.createdAt.toISOString(),
              ...(version.reviewedByCollaboratorId
                ? { reviewedByCollaboratorId: version.reviewedByCollaboratorId }
                : {}),
              ...(version.reviewedAt
                ? { reviewedAt: version.reviewedAt.toISOString() }
                : {}),
              ...(version.rejectionReason
                ? { rejectionReason: version.rejectionReason }
                : {}),
            })),
        },
      ]
    })
  }

  private isFreshVersion(
    versionId: string,
    versions: readonly DocumentVersion[],
    generations: readonly DocumentGeneration[],
    formalizationId: string,
    revision: number,
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
            generation.source.id === formalizationId &&
            data.formalization?.id === formalizationId &&
            data.formalization.contractFormRevision === revision,
        )
      }
      version = version.sourceDocumentVersionId
        ? versionsById.get(version.sourceDocumentVersionId)
        : undefined
    }
    return false
  }
}
