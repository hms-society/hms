import type { PackageDocument } from '@hms/core/document-production/domain/entities'

import type { DrizzlePackageDocument } from '@/document-production/database/drizzle/types'

export class DrizzlePackageDocumentMapper {
  toDomain(record: DrizzlePackageDocument): PackageDocument {
    return record
  }
}
