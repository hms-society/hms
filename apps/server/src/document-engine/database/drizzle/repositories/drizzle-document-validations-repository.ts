import { Inject, Injectable } from '@nestjs/common'
import { and, desc, eq, sql } from 'drizzle-orm'
import type {
  DocumentValidationDocument,
  DocumentValidationDuplicateMatch,
  DocumentValidationExtractedField,
  DocumentValidationFailure,
  DocumentValidationHumanCorrection,
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

import { collaboratorModel, userModel } from '@/identity/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { documentBatchFileModel, documentBatchModel } from '../models'

type DocumentValidationRecord = typeof documentBatchFileModel.$inferSelect & {
  batch: typeof documentBatchModel.$inferSelect
  reviewerName?: string | null
}

@Injectable()
export class DrizzleDocumentValidationsRepository
  extends DrizzleRepository
  implements DocumentValidationsRepository
{
  constructor(@Inject(DrizzleClient) drizzle: DrizzleClient) {
    super(drizzle)
  }

  async list(
    filters: ListDocumentValidationsFilters = {},
  ): Promise<DocumentValidationDocument[]> {
    const query = this.database
      .select({
        file: documentBatchFileModel,
        batch: documentBatchModel,
        reviewerName: sql<
          string | null
        >`coalesce(${collaboratorModel.professionalName}, ${userModel.email})`,
      })
      .from(documentBatchFileModel)
      .innerJoin(
        documentBatchModel,
        eq(documentBatchFileModel.batchId, documentBatchModel.id),
      )
      .leftJoin(userModel, eq(documentBatchFileModel.reviewedBy, userModel.id))
      .leftJoin(collaboratorModel, eq(collaboratorModel.userId, userModel.id))
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
      this.toDomain({
        ...record.file,
        batch: record.batch,
        reviewerName: record.reviewerName,
      }),
    )
  }

  async findByFileId(
    documentFileId: string,
  ): Promise<DocumentValidationDocument | undefined> {
    const [record] = await this.database
      .select({
        file: documentBatchFileModel,
        batch: documentBatchModel,
        reviewerName: sql<
          string | null
        >`coalesce(${collaboratorModel.professionalName}, ${userModel.email})`,
      })
      .from(documentBatchFileModel)
      .innerJoin(
        documentBatchModel,
        eq(documentBatchFileModel.batchId, documentBatchModel.id),
      )
      .leftJoin(userModel, eq(documentBatchFileModel.reviewedBy, userModel.id))
      .leftJoin(collaboratorModel, eq(collaboratorModel.userId, userModel.id))
      .where(eq(documentBatchFileModel.id, documentFileId))

    if (!record) {
      return undefined
    }

    return this.toDomain({
      ...record.file,
      batch: record.batch,
      reviewerName: record.reviewerName,
    })
  }

  async recordAnalysis(
    input: RecordDocumentValidationAnalysisInput,
  ): Promise<DocumentValidationDocument> {
    await this.database
      .update(documentBatchFileModel)
      .set({
        status: input.status,
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

  async recordDecision(
    input: RecordDocumentValidationDecisionInput,
  ): Promise<DocumentValidationDocument> {
    const humanCorrection: DocumentValidationHumanCorrection = {
      decision: input.decision,
      documentTypeId: input.documentTypeId,
      checklistRequirementId: input.checklistRequirementId,
      reason: input.reason,
      originalDocumentId: input.originalDocumentId,
    }

    await this.database
      .update(documentBatchFileModel)
      .set({
        status: input.status,
        humanCorrection,
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
  ): Promise<DocumentValidationDocument> {
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

  private toDomain(record: DocumentValidationRecord): DocumentValidationDocument {
    const aiSuggestion = this.toRecord(record.aiSuggestion)
    const extractedFields = this.toExtractedFields(record.extractedFields)
    const missingFields = this.toStringList(record.missingFields)
    const duplicateMatch = this.toDuplicateMatch(record)
    const failure = this.toFailure(aiSuggestion)

    return {
      id: record.id,
      batchId: record.batchId,
      fileName: record.originalName,
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes,
      storagePath: record.storagePath,
      hashSha256: record.hashSha256 ?? undefined,
      status:
        (record.status as DocumentValidationDocument['status'] | null) ??
        DocumentValidationStatus.AwaitingValidation,
      channel: record.batch.channel as DocumentValidationDocument['channel'],
      sender: record.batch.sender,
      clientId: record.batch.clientId ?? undefined,
      receivedAt: record.batch.createdAt,
      createdAt: record.createdAt,
      reviewedBy: record.reviewedBy ?? undefined,
      reviewedByName: record.reviewerName ?? undefined,
      reviewedAt: record.reviewedAt ?? undefined,
      aiConfidence: record.aiConfidence ?? undefined,
      aiSuggestion,
      extractedFields,
      missingFields,
      checklistLink: {
        caseId: record.caseId ?? undefined,
        caseLabel: (aiSuggestion.caseLabel as string | undefined) ?? undefined,
        checklistItemId: record.checklistItemId ?? undefined,
        checklistItemLabel:
          (aiSuggestion.checklistItemLabel as string | undefined) ?? undefined,
      },
      duplicateMatch,
      failure,
      humanCorrection: this.toHumanCorrection(record.humanCorrection),
    }
  }

  private toExtractedFields(value: unknown): DocumentValidationExtractedField[] {
    if (!Array.isArray(value)) {
      return []
    }

    return value.filter((item): item is DocumentValidationExtractedField => {
      return typeof item === 'object' && item !== null && 'label' in item
    })
  }

  private toStringList(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return []
    }

    return value.filter((item): item is string => typeof item === 'string')
  }

  private toRecord(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return {}
    }

    return value as Record<string, unknown>
  }

  private toHumanCorrection(
    value: unknown,
  ): DocumentValidationHumanCorrection | undefined {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return undefined
    }

    return value as DocumentValidationHumanCorrection
  }

  private toDuplicateMatch(
    record: DocumentValidationRecord,
  ): DocumentValidationDuplicateMatch | undefined {
    if (!record.originalDocumentId) {
      return undefined
    }

    const aiSuggestion = this.toRecord(record.aiSuggestion)

    return {
      documentFileId: record.originalDocumentId,
      fileName:
        (aiSuggestion.originalDocumentFileName as string | undefined) ??
        'comprovante-residencia.pdf',
      receivedAt: record.createdAt,
      caseLabel: (aiSuggestion.caseLabel as string | undefined) ?? 'Caso 0089',
      checklistItemLabel:
        (aiSuggestion.checklistItemLabel as string | undefined) ??
        'Comprovante de residência',
      hashSha256: record.hashSha256 ?? undefined,
    }
  }

  private toFailure(
    aiSuggestion: Record<string, unknown>,
  ): DocumentValidationFailure | undefined {
    if (!aiSuggestion.failureReason) {
      return undefined
    }

    return {
      reason: String(aiSuggestion.failureReason),
      instruction: aiSuggestion.failureInstruction
        ? String(aiSuggestion.failureInstruction)
        : undefined,
    }
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
