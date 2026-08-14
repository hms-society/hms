import type { DocumentPackage, DocumentPackageCreation } from '../domain/entities'
import type { DocumentPackageContext } from '../domain/structures'

export interface DocumentPackagesRepository {
  add(documentPackage: DocumentPackageCreation): Promise<DocumentPackage>
  addMany(
    documentPackages: readonly DocumentPackageCreation[],
  ): Promise<readonly DocumentPackage[]>
  findById(documentPackageId: string): Promise<DocumentPackage | undefined>
  findByContext(context: DocumentPackageContext): Promise<DocumentPackage | undefined>
  removeAll(): Promise<void>
}
