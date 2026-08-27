import type { PackageDocument, PackageDocumentCreation } from '../domain/entities'

export interface PackageDocumentsRepository {
  add(packageDocument: PackageDocumentCreation): Promise<PackageDocument>
  addMany(
    packageDocuments: readonly PackageDocumentCreation[],
  ): Promise<readonly PackageDocument[]>
  replaceForDocumentPackage(
    documentPackageId: string,
    packageDocuments: readonly PackageDocumentCreation[],
  ): Promise<readonly PackageDocument[]>
  findByDocumentPackageId(documentPackageId: string): Promise<readonly PackageDocument[]>
  findByDocumentId(documentId: string): Promise<PackageDocument | undefined>
  removeAll(): Promise<void>
}
