import type { FormalizationSignatureSnapshot } from '../domain/entities'
export interface FormalizationSignatureSnapshotsRepository {
  add(snapshot: FormalizationSignatureSnapshot): Promise<void>
  findById(snapshotId: string): Promise<FormalizationSignatureSnapshot | null>
  findByHash(snapshotHash: string): Promise<FormalizationSignatureSnapshot | null>
}
