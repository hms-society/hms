import type { DocumentValidationDocument } from '../domain/entities'
import type { DocumentValidationStatus } from '../domain/structures'

export type DocumentValidationAnalysis = {
  status: DocumentValidationStatus
  aiConfidence?: number
  aiSuggestion?: Record<string, unknown>
  extractedFields: Record<string, unknown>[]
  missingFields: string[]
  caseId?: string
  checklistItemId?: string
  originalDocumentId?: string
}

export interface DocumentValidationAnalyzerProvider {
  analyze(document: DocumentValidationDocument): Promise<DocumentValidationAnalysis>
}
