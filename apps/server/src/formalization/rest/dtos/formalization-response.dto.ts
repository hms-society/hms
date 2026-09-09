import type { FormalizationDetails } from '@hms/core/formalization/domain/entities'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class FormalizationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) intakeId!: string
  @ApiProperty({ format: 'uuid' }) clientId!: string
  @ApiProperty({ format: 'uuid' }) consultationId!: string
  @ApiProperty({ format: 'uuid' }) assignedLawyerId!: string
  @ApiPropertyOptional({ format: 'uuid' }) legalAreaId?: string
  @ApiPropertyOptional({ format: 'uuid' }) legalTopicId?: string
  @ApiProperty() status!: string
  @ApiProperty({ format: 'uuid' }) contractFormId!: string
  @ApiProperty({ type: 'object', additionalProperties: true })
  contractFormSnapshot!: object
  @ApiProperty({ type: 'array' }) contractFormAnswers!: readonly object[]
  @ApiProperty() contractFormState!: string
  @ApiProperty() contractFormRevision!: number
  @ApiPropertyOptional() contractFormClosedAt?: Date
  @ApiPropertyOptional() contractFormClosedByCollaboratorId?: string
  @ApiPropertyOptional() documentsConfirmedAt?: Date
  @ApiPropertyOptional() documentsConfirmedByCollaboratorId?: string
  @ApiPropertyOptional() documentsConfirmedRevision?: number
  @ApiPropertyOptional() cancelledAt?: Date
  @ApiPropertyOptional() cancelledByCollaboratorId?: string
  @ApiProperty() version!: number
  @ApiProperty() createdAt!: Date
  @ApiProperty() updatedAt!: Date
  @ApiProperty({ type: 'object', additionalProperties: true }) intake!: object
  @ApiProperty({ type: 'object', additionalProperties: true }) consultation!: object
  @ApiProperty({ type: 'object', additionalProperties: true }) client!: object
  @ApiProperty({ type: 'object', additionalProperties: true }) assignedLawyer!: object

  static fromDomain(input: FormalizationDetails): FormalizationResponseDto {
    return { ...input.formalization, ...input } as FormalizationResponseDto
  }
}
