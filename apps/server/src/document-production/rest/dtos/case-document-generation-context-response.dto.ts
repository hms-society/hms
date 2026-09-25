import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { CaseDocumentGenerationContext } from '@hms/core/case-management/use-cases'

class CaseDocumentGenerationModelDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() name!: string
  @ApiProperty() description!: string
}

class CaseDocumentGenerationSourceDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) checklistItemId!: string
  @ApiProperty() label!: string
  @ApiProperty() fileName!: string
  @ApiProperty() validationStatus!: string
  @ApiProperty() reviewedAt!: Date
  @ApiProperty({ format: 'uuid' }) reviewedBy!: string
}

export class CaseDocumentGenerationContextResponseDto {
  @ApiProperty({ type: Object }) case!: CaseDocumentGenerationContext['case']
  @ApiProperty({ type: [CaseDocumentGenerationModelDto] })
  models!: CaseDocumentGenerationModelDto[]
  @ApiProperty({ type: [CaseDocumentGenerationSourceDto] })
  documents!: CaseDocumentGenerationSourceDto[]
  @ApiPropertyOptional() checklistGateDecision?: string
  @ApiProperty() canGenerate!: boolean

  static fromDomain(
    context: CaseDocumentGenerationContext,
  ): CaseDocumentGenerationContextResponseDto {
    return {
      case: context.case,
      models: [...context.models],
      documents: [...context.documents],
      ...(context.checklistGateDecision
        ? { checklistGateDecision: context.checklistGateDecision }
        : {}),
      canGenerate: context.canGenerate,
    }
  }
}
