import type { DrizzleDocumentBatch } from '../types/entities/drizzle-document-batch'
import type { DocumentBatch } from '@hms/core/documents/domain/entities'

export class DrizzleDocumentBatchMapper {
  toDomain(record: DrizzleDocumentBatch): DocumentBatch {
    return {
      id: record.id,
      readableId: record.readableId,
      status: record.status as DocumentBatch['status'],
      channel: record.channel as DocumentBatch['channel'],
      sender: record.sender,
      inTriageBox: record.inTriageBox,
      clientId: record.clientId ?? undefined,
      intakeId: record.intakeId ?? undefined,
      createdBy: record.createdBy ?? undefined,
      files: record.files.map((file) => ({
        id: file.id,
        batchId: file.batchId,
        storagePath: file.storagePath,
        originalName: file.originalName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        createdAt: file.createdAt,
      })),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}