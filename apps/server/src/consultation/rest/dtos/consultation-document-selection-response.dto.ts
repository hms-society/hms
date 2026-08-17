import type { ConsultationDocumentSelection } from '@hms/core/consultation/domain/structures'
import { ApiProperty } from '@nestjs/swagger'

class ConsultationDocumentSelectionOptionResponseDto {
  @ApiProperty({ format: 'uuid' }) documentSpecificationId!: string
  @ApiProperty() name!: string
  @ApiProperty() description!: string
  @ApiProperty({ type: 'object', additionalProperties: true }) application!: object
  @ApiProperty() isRequired!: boolean
  @ApiProperty({ enum: ['available', 'unavailable'] }) status!: string
  @ApiProperty() selected!: boolean
  @ApiProperty() hasVersion!: boolean
}

export class ConsultationDocumentSelectionResponseDto {
  @ApiProperty({ type: [ConsultationDocumentSelectionOptionResponseDto] })
  options!: readonly ConsultationDocumentSelectionOptionResponseDto[]

  @ApiProperty({ format: 'uuid', isArray: true })
  selectedDocumentSpecificationIds!: readonly string[]

  static fromDomain(input: ConsultationDocumentSelection) {
    return {
      options: input.options,
      selectedDocumentSpecificationIds: input.selectedDocumentSpecificationIds,
    }
  }
}
