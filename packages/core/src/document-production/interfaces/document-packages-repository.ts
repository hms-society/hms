import type { DocumentPackage, DocumentPackageCreation } from '../domain/entities'
import type { DocumentPackageContext } from '../domain/structures'
import type { SignatureDispatchInfo } from '../domain/structures/signature-dispatch-info'

export interface DocumentPackagesRepository {
  add(documentPackage: DocumentPackageCreation): Promise<DocumentPackage>
  addMany(
    documentPackages: readonly DocumentPackageCreation[],
  ): Promise<readonly DocumentPackage[]>
  findById(documentPackageId: string): Promise<DocumentPackage | undefined>
  findByContext(context: DocumentPackageContext): Promise<DocumentPackage | undefined>
  removeAll(): Promise<void>
  findDispatchInfoByIntakeId(
    intakeId: string,
  ): Promise<SignatureDispatchInfo | null>
}
