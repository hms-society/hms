import type { DocumentPackage, DocumentVersion } from '../domain/entities'
import { DocumentVersionStatus } from '../domain/structures'
import type {
  DocumentPackagesRepository,
  DocumentVersionHomologationsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../interfaces'
import type { DatetimeProvider, UseCase } from '#shared/interfaces'

type Request = {
  readonly caseId: string
  readonly documentVersionId: string
  readonly collaboratorId: string
}

export class ConfirmCaseDocumentPackageAfterHomologationUseCase
  implements UseCase<Request, DocumentPackage | undefined>
{
  constructor(
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly documentVersionsRepository: DocumentVersionsRepository,
    private readonly homologationsRepository: DocumentVersionHomologationsRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request) {
    const homologation = await this.homologationsRepository.findByDocumentVersionId(
      request.documentVersionId,
    )
    if (!homologation || homologation.caseId !== request.caseId) return undefined

    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'case',
      caseId: request.caseId,
    })
    if (!documentPackage || documentPackage.confirmedAt) return documentPackage

    const packageDocuments =
      await this.packageDocumentsRepository.findByDocumentPackageId(documentPackage.id)
    if (packageDocuments.length === 0) return documentPackage

    const versions = await this.documentVersionsRepository.findByDocumentIds(
      packageDocuments.map((document) => document.documentId),
    )
    const latestVersions = latestVersionsByDocumentId(versions)
    const everyDocumentIsHomologated = await Promise.all(
      packageDocuments.map(async (document) => {
        const latestVersion = latestVersions.get(document.documentId)
        if (!latestVersion || latestVersion.status !== DocumentVersionStatus.Approved) {
          return false
        }
        const latestHomologation =
          await this.homologationsRepository.findByDocumentVersionId(latestVersion.id)
        return latestHomologation !== undefined
      }),
    )

    if (!everyDocumentIsHomologated.every(Boolean)) return documentPackage

    return (
      (await this.documentPackagesRepository.confirm(
        documentPackage.id,
        request.collaboratorId,
        this.datetimeProvider.now(),
      )) ?? documentPackage
    )
  }
}

function latestVersionsByDocumentId(versions: readonly DocumentVersion[]) {
  const latestVersions = new Map<string, DocumentVersion>()
  for (const version of versions) {
    const current = latestVersions.get(version.documentId)
    if (!current || version.versionNumber > current.versionNumber) {
      latestVersions.set(version.documentId, version)
    }
  }
  return latestVersions
}
