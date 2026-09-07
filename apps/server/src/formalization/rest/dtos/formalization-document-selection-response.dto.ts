import type { FormalizationDocumentSelection } from '@hms/core/formalization/domain/structures'

export class FormalizationDocumentSelectionResponseDto {
  static fromDomain(input: FormalizationDocumentSelection) {
    return {
      options: input.options,
      selectedDocumentSpecificationIds: input.selectedDocumentSpecificationIds,
      confirmedAt: input.confirmedAt,
      confirmedByCollaboratorId: input.confirmedByCollaboratorId,
    }
  }
}
