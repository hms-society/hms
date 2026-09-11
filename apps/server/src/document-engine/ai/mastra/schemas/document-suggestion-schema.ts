import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'
import { z } from 'zod'

import { confidenceSchema } from './confidence-schema'
import { documentSuggestionEvidenceSchema } from './document-suggestion-evidence-schema'
import { documentSuggestionFieldSchema } from './document-suggestion-field-schema'

export const documentSuggestionSchema = z.object({
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
  extractedFields: z.array(documentSuggestionFieldSchema),
  missingFields: z.array(z.string().min(1)),
  evidence: z.array(documentSuggestionEvidenceSchema),
  failureReason: z.string().optional(),
  failureInstruction: z.string().optional(),
  originalDocumentId: z.string().uuid().optional(),
  originalDocumentFileName: z.string().optional(),
})
