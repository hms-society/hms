import type {
  DocumentGenerationMoment,
  DocumentSpecificationStatus,
} from '@hms/core/document-production/domain/structures'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class DocumentSpecificationLegalTopicResponseDto {
  @ApiProperty({ format: 'uuid' }) legalTopicId!: string
  @ApiProperty() legalTopicName!: string
}

export class DocumentSpecificationLegalExpertiseResponseDto {
  @ApiProperty({ format: 'uuid' }) legalAreaId!: string
  @ApiProperty() legalAreaName!: string
  @ApiProperty({ type: () => [DocumentSpecificationLegalTopicResponseDto] })
  legalTopics!: DocumentSpecificationLegalTopicResponseDto[]
}

export class DocumentSpecificationApplicationResponseDto {
  @ApiProperty({ enum: ['global', 'legal_context'] }) scope!: string
  @ApiProperty({ enum: ['consultation', 'formalization', 'legal_production'] })
  moment!: DocumentGenerationMoment
  @ApiPropertyOptional({ type: () => [DocumentSpecificationLegalExpertiseResponseDto] })
  legalExpertises?: DocumentSpecificationLegalExpertiseResponseDto[]
}

export class DocumentSpecificationListItemResponseDto {
  @ApiProperty({ format: 'uuid' }) documentSpecificationId!: string
  @ApiProperty() name!: string
  @ApiProperty() description!: string
  @ApiProperty({ type: () => DocumentSpecificationApplicationResponseDto })
  application!: DocumentSpecificationApplicationResponseDto
  @ApiProperty() isRequired!: boolean
  @ApiProperty({ enum: ['available', 'unavailable'] })
  status!: DocumentSpecificationStatus
}
