import { Injectable } from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import type { DocumentExceptionAuditLog } from '@hms/core/document-engine/domain/entities'
import type {
  CreateDocumentExceptionAuditLogData,
  DocumentExceptionAuditLogsRepository,
} from '@hms/core/document-engine/interfaces'

import { documentExceptionAuditLogModel } from '../models/document-exception-audit-log-model'

@Injectable()
export class DrizzleDocumentExceptionAuditLogsRepository extends DrizzleRepository implements DocumentExceptionAuditLogsRepository {
  constructor(drizzle: DrizzleClient) {
    super(drizzle)
  }

  async create(data: CreateDocumentExceptionAuditLogData): Promise<void> {
    await this.database
      .insert(documentExceptionAuditLogModel)
      .values({
        documentExceptionId: data.documentExceptionId,
        action: data.action,
        userId: data.userId,
        metadata: data.metadata,
      })
  }
}
