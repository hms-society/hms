import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'
import { z } from 'zod'

const confidenceSchema = z.preprocess((value) => {
  if (typeof value !== 'number') return value

  return value > 1 ? value / 100 : value
}, z.number().min(0).max(1))

export const inputSchema = z.object({
  batchId: z.string().uuid(),
  documentFileId: z.string().uuid(),
  storagePath: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(0),
})

export const metadataSchema = z.object({
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(0),
  hashSha256: z.string().length(64),
  pageCount: z.number().int().min(0).optional(),
  textLength: z.number().int().min(0).optional(),
  extractedTextFull: z.string().optional(),
})

export const extractedFieldSchema = z.object({
  label: z.string().min(1),
  value: z.string(),
  confidence: confidenceSchema.optional(),
  isRequired: z.boolean().optional(),
  isMissing: z.boolean().optional(),
})

export const evidenceSchema = z.object({
  field: z.string().min(1),
  sourceText: z.string().min(1),
})

export const referenceCandidatesSchema = z.object({
  cases: z.array(
    z.object({
      id: z.string().uuid(),
      label: z.string().min(1),
    }),
  ),
  checklistItems: z.array(
    z.object({
      id: z.string().uuid(),
      caseId: z.string().uuid(),
      label: z.string().min(1),
      templateItemKey: z.string().optional(),
    }),
  ),
})

export const suggestionSchema = z.object({
  suggestedStatus: z.enum(DocumentValidationStatus).optional(),
  documentTypeId: z.string().optional(),
  documentTypeLabel: z.string().optional(),
  checklistRequirementId: z.string().optional(),
  checklistItemId: z.string().uuid().optional(),
  checklistItemLabel: z.string().optional(),
  caseId: z.string().uuid().optional(),
  caseLabel: z.string().optional(),
  confidence: confidenceSchema,
  confidenceLabel: z.string().optional(),
  extractedFields: z.array(extractedFieldSchema),
  missingFields: z.array(z.string().min(1)),
  evidence: z.array(evidenceSchema),
  failureReason: z.string().optional(),
  failureInstruction: z.string().optional(),
  originalDocumentId: z.string().uuid().optional(),
  originalDocumentFileName: z.string().optional(),
})

export const outputSchema = z.object({
  batchId: z.string().uuid(),
  documentFileId: z.string().uuid(),
  metadata: metadataSchema,
  referenceCandidates: referenceCandidatesSchema.optional(),
  suggestion: suggestionSchema.optional(),
})
