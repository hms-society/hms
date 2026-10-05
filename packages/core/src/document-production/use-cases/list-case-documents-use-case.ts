import type { UseCase } from '#shared/interfaces/use-case'
import type { LegalCasesRepository } from '../../case-management/interfaces'
import type { Document, DocumentGeneration, DocumentVersion } from '../domain/entities'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../interfaces'

type Request = { caseId: string }
export type ListCaseDocumentsResponse = readonly {
  document: Document
  versions: readonly DocumentVersion[]
  generation?: DocumentGeneration
}[]

export class ListCaseDocumentsUseCase
  implements UseCase<Request, ListCaseDocumentsResponse>
{
  constructor(
    private readonly cases: LegalCasesRepository,
    private readonly packages: DocumentPackagesRepository,
    private readonly packageDocuments: PackageDocumentsRepository,
    private readonly documents: DocumentsRepository,
    private readonly versions: DocumentVersionsRepository,
    private readonly generations: DocumentGenerationsRepository,
  ) {}

  async execute({ caseId }: Request): Promise<ListCaseDocumentsResponse> {
    const legalCase = await this.cases.findById(caseId)
    if (!legalCase) return []
    const documentPackage = await this.packages.findByContext({ type: 'case', caseId })
    if (!documentPackage) return []
    const packageDocuments = await this.packageDocuments.findByDocumentPackageId(
      documentPackage.id,
    )
    const documentIds = packageDocuments.map(({ documentId }) => documentId)
    const [documents, versions, generations] = await Promise.all([
      this.documents.findByIds(documentIds),
      this.versions.findByDocumentIds(documentIds),
      this.generations.findLatestByDocumentIds(documentIds),
    ])
    const documentsById = new Map(documents.map((document) => [document.id, document]))
    const generationsByDocumentId = new Map(
      generations.map((generation) => [generation.documentId, generation]),
    )
    return packageDocuments.flatMap(({ documentId }) => {
      const document = documentsById.get(documentId)
      return document
        ? [
            {
              document,
              versions: versions.filter((version) => version.documentId === documentId),
              generation: generationsByDocumentId.get(documentId),
            },
          ]
        : []
    })
  }
}
