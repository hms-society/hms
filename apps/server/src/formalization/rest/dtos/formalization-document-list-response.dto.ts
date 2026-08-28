import type { FormalizationDocumentListItem } from '@hms/core/formalization/domain/structures'

export class FormalizationDocumentListResponseDto {
  static fromDomain(input: readonly FormalizationDocumentListItem[]) {
    return input
  }
}
