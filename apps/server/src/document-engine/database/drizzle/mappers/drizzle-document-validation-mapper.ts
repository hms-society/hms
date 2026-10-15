import type {
  DocumentValidationRecord,
  DocumentValidationExtractedField,
  DocumentValidationFailure,
  DocumentValidationHumanCorrection,
} from '@hms/core/document-engine/domain/entities'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'
import type { DrizzleDocumentValidation } from '../types/entities'

export class DrizzleDocumentValidationMapper {
  toDomain(record: DrizzleDocumentValidation): DocumentValidationRecord {
    const aiSuggestion = this.asRecord(record.aiSuggestion)
    return {
      id: record.id,
      batchId: record.batchId,
      fileName: record.originalName,
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes,
      storagePath: record.storagePath,
      hashSha256: record.hashSha256 ?? undefined,
      status:
        (record.status as DocumentValidationRecord['status'] | null) ??
        DocumentValidationStatus.AwaitingValidation,
      channel: record.batch.channel as DocumentValidationRecord['channel'],
      sender: record.batch.sender,
      clientId: record.batch.clientId ?? undefined,
      receivedAt: record.batch.createdAt,
      createdAt: record.createdAt,
      reviewedBy: record.reviewedBy ?? undefined,
      reviewedAt: record.reviewedAt ?? undefined,
      aiConfidence: record.aiConfidence ?? undefined,
      aiSuggestion,
      extractedFields: this.toExtractedFields(record.extractedFields),
      missingFields: this.toStringList(record.missingFields),
      checklistLink: {
        caseId: record.caseId ?? undefined,
        caseLabel:
          record.caseLabel ?? (aiSuggestion.caseLabel as string | undefined) ?? undefined,
        checklistItemId: record.checklistItemId ?? undefined,
        checklistItemLabel:
          record.checklistItemLabel ??
          (aiSuggestion.checklistItemLabel as string | undefined) ??
          undefined,
      },
      duplicateMatch: this.toDuplicateMatch(record, aiSuggestion),
      failure: this.toFailure(aiSuggestion),
      humanCorrection: this.toHumanCorrection(record.humanCorrection),
    }
  }

  private toExtractedFields(value: unknown): DocumentValidationExtractedField[] {
    if (!Array.isArray(value)) return []
    return value.filter(
      (item): item is DocumentValidationExtractedField =>
        typeof item === 'object' && item !== null && 'label' in item,
    )
  }

  private toStringList(value: unknown): string[] {
    if (!Array.isArray(value)) return []
    return value.filter((item): item is string => typeof item === 'string')
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
    return value as Record<string, unknown>
  }

  private toHumanCorrection(
    value: unknown,
  ): DocumentValidationHumanCorrection | undefined {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
      return undefined
    return value as DocumentValidationHumanCorrection
  }

  private toDuplicateMatch(
    record: DrizzleDocumentValidation,
    aiSuggestion: Record<string, unknown>,
  ): DocumentValidationRecord['duplicateMatch'] {
    if (!record.originalDocumentId) return undefined
    return {
      documentFileId: record.originalDocumentId,
      fileName:
        (aiSuggestion.originalDocumentFileName as string | undefined) ??
        'Documento relacionado',
      receivedAt: record.createdAt,
      hashSha256: record.hashSha256 ?? undefined,
    }
  }

  private toFailure(
    aiSuggestion: Record<string, unknown>,
  ): DocumentValidationFailure | undefined {
    if (!aiSuggestion.failureReason) return undefined
    return {
      reason: String(aiSuggestion.failureReason),
      instruction: aiSuggestion.failureInstruction
        ? String(aiSuggestion.failureInstruction)
        : undefined,
    }
  }
}
