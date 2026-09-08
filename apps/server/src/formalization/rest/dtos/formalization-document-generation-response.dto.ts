import type { FormalizationDocumentGeneration } from '@hms/core/formalization/use-cases'

export class FormalizationDocumentGenerationResponseDto {
  static fromDomain(input: FormalizationDocumentGeneration) {
    return input
  }
}
