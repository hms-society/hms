import type { FormalizationSignatureSnapshot } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureSnapshot } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-snapshot'
import { decodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'

export class DrizzleFormalizationSignatureSnapshotMapper {
  toDomain(
    record: DrizzleFormalizationSignatureSnapshot,
  ): FormalizationSignatureSnapshot {
    return {
      ...(record as unknown as FormalizationSignatureSnapshot),
      snapshotHash: decodeSignatureHash(record.snapshotHash),
    }
  }
}
