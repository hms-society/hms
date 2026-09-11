import type { DocumentJsonOrganization } from '@/document-engine/ai/mastra/schemas'

export type DocumentJsonOrganizationResult =
  | {
      captured: true
      suggestion: DocumentJsonOrganization
    }
  | {
      captured: false
      reason: string
    }
