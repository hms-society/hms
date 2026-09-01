import type { File } from '@hms/core/shared/domain/entities'

import { storedFileModel } from '@/shared/database/drizzle/models/stored-file-model'

export class StoredFileMapper {
  toDomain(record: typeof storedFileModel.$inferSelect): File {
    return {
      id: record.id,
      filePath: record.filePath,
      fileName: record.fileName,
      contentType: record.contentType,
      sizeInBytes: record.sizeInBytes,
      createdAt: record.createdAt,
    }
  }
}
