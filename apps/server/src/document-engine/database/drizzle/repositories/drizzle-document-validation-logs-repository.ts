import { asc, eq } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'
import type { DocumentValidationLog } from '@hms/core/document-engine/domain/entities'
import type { DocumentValidationLogsRepository } from '@hms/core/document-engine/interfaces'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { documentValidationLogModel } from '../models/document-validation-log-model'

@Injectable()
export class DrizzleDocumentValidationLogsRepository
  extends DrizzleRepository
  implements DocumentValidationLogsRepository
{
  async add(record: Parameters<DocumentValidationLogsRepository['add']>[0]) {
    const [inserted] = await this.database
      .insert(documentValidationLogModel)
      .values({
        documentFileId: record.documentFileId,
        actorId: record.actorId,
        action: record.action,
        status: record.status,
        decision: record.decision,
        reason: record.reason,
        message: record.message,
        metadata: record.metadata,
      })
      .returning()

    return this.mapToDomain(inserted)
  }

  async listByDocumentFileId(documentFileId: string) {
    const logs = await this.database
      .select()
      .from(documentValidationLogModel)
      .where(eq(documentValidationLogModel.documentFileId, documentFileId))
      .orderBy(asc(documentValidationLogModel.createdAt))

    return logs.map((log) => this.mapToDomain(log))
  }

  private mapToDomain(
    log: typeof documentValidationLogModel.$inferSelect,
  ): DocumentValidationLog {
    return {
      id: log.id,
      documentFileId: log.documentFileId,
      actorId: log.actorId ?? undefined,
      action: log.action as DocumentValidationLog['action'],
      status: log.status ?? undefined,
      decision: log.decision as DocumentValidationLog['decision'],
      reason: log.reason ?? undefined,
      message: log.message ?? undefined,
      metadata: log.metadata as DocumentValidationLog['metadata'],
      createdAt: log.createdAt,
    }
  }
}
