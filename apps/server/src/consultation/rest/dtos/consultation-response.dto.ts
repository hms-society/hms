import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { ConsultationDetails } from '@hms/core/consultation/domain/entities'

export class ConsultationResponseDto {
  @ApiProperty({ format: 'uuid' }) readonly id!: string
  @ApiProperty({ format: 'uuid' }) readonly intakeId!: string
  @ApiProperty({ format: 'uuid' }) readonly appointmentId!: string
  @ApiProperty({ format: 'uuid' }) readonly clientId!: string
  @ApiProperty({ format: 'uuid' }) readonly assignedLawyerId!: string
  @ApiPropertyOptional({ format: 'uuid' }) readonly legalAreaId?: string
  @ApiPropertyOptional({ format: 'uuid' }) readonly legalTopicId?: string
  @ApiProperty() readonly status!: string
  @ApiProperty() readonly modality!: string
  @ApiPropertyOptional() readonly channel?: string
  @ApiPropertyOptional() readonly primaryLegalQuestion?: string
  @ApiPropertyOptional() readonly guidanceProvided?: string
  @ApiPropertyOptional() readonly notes?: string
  @ApiPropertyOptional() readonly viability?: string
  @ApiPropertyOptional() readonly decision?: string
  @ApiPropertyOptional({ format: 'uuid' }) readonly dynamicFormId?: string
  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  readonly dynamicFormAnswers?: readonly object[]
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  readonly dynamicFormSnapshot?: object
  @ApiPropertyOptional() readonly attendanceFinalizedAt?: Date
  @ApiPropertyOptional({ format: 'uuid' })
  readonly attendanceFinalizedByCollaboratorId?: string
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  readonly relevantFacts!: object[]
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  readonly potentialLegalRequests!: object[]
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  readonly identifiedRisks!: object[]
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  readonly suggestions!: object[]
  @ApiProperty() readonly createdAt!: Date
  @ApiProperty() readonly updatedAt!: Date
  @ApiPropertyOptional({ type: Object }) readonly intake?: object
  @ApiPropertyOptional({ type: Object }) readonly client?: object
  @ApiPropertyOptional({ type: Object }) readonly responsible?: object
  @ApiPropertyOptional({ type: Object }) readonly assignedLawyer?: object
  @ApiPropertyOptional({ type: Object }) readonly appointment?: object

  static fromDomain(input: ConsultationDetails): ConsultationResponseDto {
    return input
  }
}
