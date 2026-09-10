import { z } from 'zod'

import { documentFileMetadataSchema } from './document-file-metadata-schema'
import { documentReferenceCandidatesSchema } from './document-reference-candidates-schema'
import { documentSuggestionSchema } from './document-suggestion-schema'

export const inputSchema = z.object({
  batchId: z.string().uuid(),
  documentFileId: z.string().uuid(),
  storagePath: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(0),
})

export const outputSchema = z.object({
  batchId: z.string().uuid(),
  documentFileId: z.string().uuid(),
  metadata: documentFileMetadataSchema,
  referenceCandidates: documentReferenceCandidatesSchema.optional(),
  suggestion: documentSuggestionSchema.optional(),
})

export { documentFileMetadataSchema as metadataSchema }
export { documentReferenceCandidatesSchema as referenceCandidatesSchema }
export { documentSuggestionSchema as suggestionSchema }
