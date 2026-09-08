import type { DocumentVersion } from '@hms/core/document-production/domain/entities'

export class FormalizationDocumentVersionResponseDto {
  static fromDomain(input: DocumentVersion) {
    return input
  }
}
