import { Injectable } from '@nestjs/common'
import type {
  DocumentBatchAuditLogEntry,
  DocumentBatchAuditsRepository,
} from '@hms/core/document-engine/interfaces'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { documentBatchAuditModel } from '../models/document-batch-audit-model'

@Injectable()
export class DrizzleDocumentBatchAuditsRepository
  extends DrizzleRepository
  implements DocumentBatchAuditsRepository
{
  async add(entry: DocumentBatchAuditLogEntry): Promise<DocumentBatchAuditLogEntry> {
    const [inserted] = await this.database
      .insert(documentBatchAuditModel)
      .values({
        batchId: entry.batchId || null,
        fileName: entry.fileName,
        mimeType: entry.mimeType,
        sizeBytes: entry.sizeBytes,
        hashSha256: entry.hashSha256 || null,
        sender: entry.sender,
        status: entry.status,
        details: entry.details || null,
      })
      .returning()

    return {
      id: inserted.id,
      batchId: inserted.batchId,
      fileName: inserted.fileName,
      mimeType: inserted.mimeType,
      sizeBytes: inserted.sizeBytes,
      hashSha256: inserted.hashSha256,
      sender: inserted.sender,
      status: inserted.status,
      details: inserted.details,
      createdAt: inserted.createdAt,
    }
  }
}
