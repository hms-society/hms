import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'

const MIN_VISIBLE_CONFIDENCE = 0.75

export function getVisibleExtractedFields(document: DocumentValidationDocument) {
  if (document.humanCorrection?.extractedFields) {
    return document.humanCorrection.extractedFields
  }

  if (document.aiSuggestion?.ollamaJsonOrganizationCaptured !== true) {
    return []
  }

  return document.extractedFields.filter(
    (field) =>
      typeof field.confidence === 'number' && field.confidence >= MIN_VISIBLE_CONFIDENCE,
  )
}
