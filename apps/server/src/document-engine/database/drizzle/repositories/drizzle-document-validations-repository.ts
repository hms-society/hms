import { Inject, Injectable } from '@nestjs/common'
import { and, desc, eq, isNull, ne } from 'drizzle-orm'
import type {
  DocumentValidationHumanCorrection,
  DocumentValidationRecord as DocumentValidationRecordProjection,
} from '@hms/core/document-engine/domain/entities'
import type {
  DocumentValidationsRepository,
  ListDocumentValidationsFilters,
  RecordDocumentResendRequestInput,
  RecordDocumentValidationAnalysisInput,
  RecordDocumentValidationDecisionInput,
} from '@hms/core/document-engine/interfaces'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'
import { AppError } from '@hms/core/shared/domain/errors'

import {
  caseChecklistItemModel,
  legalCaseModel,
} from '@/case-management/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { documentBatchFileModel, documentBatchModel } from '../models'
import { DrizzleDocumentValidationMapper } from '../mappers/drizzle-document-validation-mapper'

@Injectable()
export class DrizzleDocumentValidationsRepository
  extends DrizzleRepository
  implements DocumentValidationsRepository
{
  constructor(
    @Inject(DrizzleClient) drizzle: DrizzleClient,
    @Inject(DrizzleDocumentValidationMapper)
    private readonly mapper: DrizzleDocumentValidationMapper,
  ) {
    super(drizzle)
  }

  async list(
    filters: ListDocumentValidationsFilters = {},
  ): Promise<DocumentValidationRecordProjection[]> {
    const query = this.database
      .select({
        file: documentBatchFileModel,
        batch: documentBatchModel,
        caseLabel: legalCaseModel.title,
        checklistItemLabel: caseChecklistItemModel.title,
      })
      .from(documentBatchFileModel)
      .innerJoin(
        documentBatchModel,
        eq(documentBatchFileModel.batchId, documentBatchModel.id),
      )
      .leftJoin(legalCaseModel, eq(documentBatchFileModel.caseId, legalCaseModel.id))
      .leftJoin(
        caseChecklistItemModel,
        eq(documentBatchFileModel.checklistItemId, caseChecklistItemModel.id),
      )
      .$dynamic()

    const conditions = [
      filters.caseId ? eq(documentBatchFileModel.caseId, filters.caseId) : undefined,
      filters.status ? eq(documentBatchFileModel.status, filters.status) : undefined,
    ].filter((condition) => condition !== undefined)

    if (conditions.length > 0) {
      query.where(and(...conditions))
    }

    const records = await query.orderBy(desc(documentBatchFileModel.createdAt))

    return records.map((record) =>
      this.mapper.toDomain({
        ...record.file,
        batch: record.batch,
        caseLabel: record.caseLabel,
        checklistItemLabel: record.checklistItemLabel,
      }),
    )
  }

  async findByFileId(
    documentFileId: string,
  ): Promise<DocumentValidationRecordProjection | undefined> {
    const [record] = await this.database
      .select({
        file: documentBatchFileModel,
        batch: documentBatchModel,
        caseLabel: legalCaseModel.title,
        checklistItemLabel: caseChecklistItemModel.title,
      })
      .from(documentBatchFileModel)
      .innerJoin(
        documentBatchModel,
        eq(documentBatchFileModel.batchId, documentBatchModel.id),
      )
      .leftJoin(legalCaseModel, eq(documentBatchFileModel.caseId, legalCaseModel.id))
      .leftJoin(
        caseChecklistItemModel,
        eq(documentBatchFileModel.checklistItemId, caseChecklistItemModel.id),
      )
      .where(eq(documentBatchFileModel.id, documentFileId))

    if (!record) {
      return undefined
    }

    return this.mapper.toDomain({
      ...record.file,
      batch: record.batch,
      caseLabel: record.caseLabel,
      checklistItemLabel: record.checklistItemLabel,
    })
  }

  async findDuplicateByHash(
    hashSha256: string,
    excludedDocumentFileId: string,
  ): Promise<DocumentValidationRecordProjection | undefined> {
    const [record] = await this.database
      .select({
        file: documentBatchFileModel,
        batch: documentBatchModel,
        caseLabel: legalCaseModel.title,
        checklistItemLabel: caseChecklistItemModel.title,
      })
      .from(documentBatchFileModel)
      .innerJoin(
        documentBatchModel,
        eq(documentBatchFileModel.batchId, documentBatchModel.id),
      )
      .leftJoin(legalCaseModel, eq(documentBatchFileModel.caseId, legalCaseModel.id))
      .leftJoin(
        caseChecklistItemModel,
        eq(documentBatchFileModel.checklistItemId, caseChecklistItemModel.id),
      )
      .where(
        and(
          eq(documentBatchFileModel.hashSha256, hashSha256),
          ne(documentBatchFileModel.id, excludedDocumentFileId),
        ),
      )
      .orderBy(desc(documentBatchFileModel.createdAt))
      .limit(1)

    if (!record) {
      return undefined
    }

    return this.mapper.toDomain({
      ...record.file,
      batch: record.batch,
      caseLabel: record.caseLabel,
      checklistItemLabel: record.checklistItemLabel,
    })
  }

  async recordAnalysis(
    input: RecordDocumentValidationAnalysisInput,
  ): Promise<DocumentValidationRecordProjection> {
    await this.database
      .update(documentBatchFileModel)
      .set({
        status: input.status,
        hashSha256: input.hashSha256,
        aiConfidence: input.aiConfidence,
        aiSuggestion: input.aiSuggestion,
        extractedFields: input.extractedFields,
        missingFields: input.missingFields,
        caseId: input.caseId,
        checklistItemId: input.checklistItemId,
        originalDocumentId: input.originalDocumentId,
        isDuplicate: input.status === DocumentValidationStatus.Duplicate,
      })
      .where(eq(documentBatchFileModel.id, input.documentFileId))

    return this.findRequiredByFileId(input.documentFileId)
  }

  async recordProcessing(
    documentFileId: string,
  ): Promise<DocumentValidationRecordProjection> {
    await this.database
      .update(documentBatchFileModel)
      .set({
        status: DocumentValidationStatus.Processing,
        aiConfidence: 0,
      })
      .where(
        and(
          eq(documentBatchFileModel.id, documentFileId),
          isNull(documentBatchFileModel.reviewedAt),
        ),
      )

    return this.findRequiredByFileId(documentFileId)
  }

  async recordDecision(
    input: RecordDocumentValidationDecisionInput,
  ): Promise<DocumentValidationRecordProjection> {
    const humanCorrection: DocumentValidationHumanCorrection = {
      decision: input.decision,
      documentTypeId: input.documentTypeId,
      checklistRequirementId: input.checklistRequirementId,
      reason: input.reason,
      originalDocumentId: input.originalDocumentId,
      extractedFields: input.extractedFields,
    }

    await this.database
      .update(documentBatchFileModel)
      .set({
        status: input.status,
        humanCorrection,
        extractedFields: input.extractedFields,
        reviewedBy: input.reviewedBy,
        reviewedAt: new Date(),
        caseId: input.caseId,
        checklistItemId: this.toOptionalUuid(input.checklistRequirementId),
        originalDocumentId: this.toOptionalUuid(input.originalDocumentId),
        isDuplicate: input.status === DocumentValidationStatus.Duplicate,
      })
      .where(eq(documentBatchFileModel.id, input.documentFileId))

    return this.findRequiredByFileId(input.documentFileId)
  }

  async recordResendRequest(
    input: RecordDocumentResendRequestInput,
  ): Promise<DocumentValidationRecordProjection> {
    const humanCorrection: DocumentValidationHumanCorrection = {
      decision: DocumentValidationStatus.ResendRequested,
      reason: input.reason,
      message: input.message,
    }

    await this.database
      .update(documentBatchFileModel)
      .set({
        status: DocumentValidationStatus.ResendRequested,
        humanCorrection,
        reviewedBy: input.reviewedBy,
        reviewedAt: new Date(),
      })
      .where(eq(documentBatchFileModel.id, input.documentFileId))

    return this.findRequiredByFileId(input.documentFileId)
  }

  private async findRequiredByFileId(documentFileId: string) {
    const document = await this.findByFileId(documentFileId)

    if (!document) {
      throw new AppError(
        'O registro de validação documental não foi encontrado após a atualização.',
        'Erro de Validação Documental',
      )
    }

    return document
  }

  private toOptionalUuid(value: string | undefined): string | undefined {
    if (!value) {
      return undefined
    }

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    return uuidPattern.test(value) ? value : undefined
  }
}
