import { z } from 'zod'

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
  confidence: z.number().min(0).max(1).optional(),
  isRequired: z.boolean().optional(),
  isMissing: z.boolean().optional(),
})

export const evidenceSchema = z.object({
  field: z.string().min(1),
  sourceText: z.string().min(1),
})

export const suggestionSchema = z.object({
  documentTypeId: z.string().optional(),
  documentTypeLabel: z.string().optional(),
  checklistRequirementId: z.string().optional(),
  checklistItemLabel: z.string().optional(),
  confidence: z.number().min(0).max(1),
  extractedFields: z.array(extractedFieldSchema),
  missingFields: z.array(z.string().min(1)),
  evidence: z.array(evidenceSchema),
})

export const outputSchema = z.object({
  documentFileId: z.string().uuid(),
  metadata: metadataSchema,
  suggestion: suggestionSchema.optional(),
})
