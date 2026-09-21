import { Injectable, Inject } from '@nestjs/common'
import { eq, and } from 'drizzle-orm'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import type { DocumentException } from '@hms/core/document-engine/domain/entities'
import {
  DocumentExceptionStatus,
  DocumentExceptionType,
} from '@hms/core/document-engine/domain/structures'
import type {
  CreateDocumentExceptionData,
  DocumentExceptionsRepository,
  UpdateDocumentExceptionStatusData,
} from '@hms/core/document-engine/interfaces'

import { documentExceptionModel } from '../models/document-exception-model'

@Injectable()
export class DrizzleDocumentExceptionsRepository
  extends DrizzleRepository
  implements DocumentExceptionsRepository
{
  constructor(@Inject(DrizzleClient) drizzle: DrizzleClient) {
    super(drizzle)
  }

  async create(data: CreateDocumentExceptionData): Promise<DocumentException> {
    const [result] = await this.database
      .insert(documentExceptionModel)
      .values({
        documentId: data.documentId ?? null,
        caseId: data.caseId,
        type: data.type as any,
        status: data.status as any,
        justification: data.justification,
        deadlineDate: data.deadlineDate ?? null,
        createdBy: data.createdBy,
      })
      .returning()

    return this.mapToEntity(result)
  }

  async findById(id: string): Promise<DocumentException | null> {
    const result = await this.database.query.documentExceptionModel.findFirst({
      where: eq(documentExceptionModel.id, id),
    })

    if (!result) return null

    return this.mapToEntity(result)
  }

  async findByCaseId(caseId: string): Promise<DocumentException[]> {
    const results = await this.database.query.documentExceptionModel.findMany({
      where: eq(documentExceptionModel.caseId, caseId),
      orderBy: (exceptions, { desc }) => [desc(exceptions.createdAt)],
    })

    return results.map(this.mapToEntity)
  }

  async updateStatus(
    id: string,
    data: UpdateDocumentExceptionStatusData,
  ): Promise<DocumentException> {
    const [result] = await this.database
      .update(documentExceptionModel)
      .set({
        status: data.status as any,
        reviewedBy: data.reviewedBy,
        ...(data.rejectionJustification !== undefined
          ? { rejectionJustification: data.rejectionJustification }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(documentExceptionModel.id, id))
      .returning()

    return this.mapToEntity(result)
  }

  async hasExpiredExceptionsForCase(caseId: string): Promise<boolean> {
    const result = await this.database.query.documentExceptionModel.findFirst({
      where: and(
        eq(documentExceptionModel.caseId, caseId),
        eq(documentExceptionModel.status, DocumentExceptionStatus.EXPIRED),
      ),
    })

    return !!result
  }

  async findExpiredProvisionalAcceptances(): Promise<DocumentException[]> {
    const results = await this.database.query.documentExceptionModel.findMany({
      where: and(
        eq(documentExceptionModel.type, DocumentExceptionType.ACEITE_PROVISORIO),
        eq(documentExceptionModel.status, DocumentExceptionStatus.PENDING),
      ),
    })

    const now = new Date()
    return results
      .filter((r) => r.deadlineDate && r.deadlineDate < now)
      .map(this.mapToEntity)
  }

  private mapToEntity(row: any): DocumentException {
    return {
      id: row.id,
      documentId: row.documentId,
      caseId: row.caseId,
      type: row.type,
      status: row.status,
      justification: row.justification,
      rejectionJustification: row.rejectionJustification,
      deadlineDate: row.deadlineDate,
      createdBy: row.createdBy,
      reviewedBy: row.reviewedBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
