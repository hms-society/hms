import type { UseCase } from '#shared/interfaces/use-case'
import type { LegalCasesRepository } from '../../case-management/interfaces'
import type { Document, DocumentVersion } from '../domain/entities'
import type { DocumentPackagesRepository, DocumentsRepository, DocumentVersionsRepository, PackageDocumentsRepository } from '../interfaces'

type Request = { caseId: string }
export type ListCaseDocumentsResponse = readonly { document: Document; versions: readonly DocumentVersion[] }[]

export class ListCaseDocumentsUseCase implements UseCase<Request, ListCaseDocumentsResponse> {
  constructor(private readonly cases: LegalCasesRepository, private readonly packages: DocumentPackagesRepository, private readonly packageDocuments: PackageDocumentsRepository, private readonly documents: DocumentsRepository, private readonly versions: DocumentVersionsRepository) {}

  async execute({ caseId }: Request): Promise<ListCaseDocumentsResponse> {
    const legalCase = await this.cases.findById(caseId)
    if (!legalCase) return []
    const documentPackage = await this.packages.findByContext({ type: 'case', caseId })
    if (!documentPackage) return []
    const packageDocuments = await this.packageDocuments.findByDocumentPackageId(documentPackage.id)
    const documentIds = packageDocuments.map(({ documentId }) => documentId)
    const [documents, versions] = await Promise.all([this.documents.findByIds(documentIds), this.versions.findByDocumentIds(documentIds)])
    const documentsById = new Map(documents.map((document) => [document.id, document]))
    return packageDocuments.flatMap(({ documentId }) => {
      const document = documentsById.get(documentId)
      return document ? [{ document, versions: versions.filter((version) => version.documentId === documentId) }] : []
    })
  }
}
