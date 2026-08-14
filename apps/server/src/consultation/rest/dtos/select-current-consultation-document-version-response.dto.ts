import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { Document } from '@hms/core/document-production/domain/entities'

export class SelectCurrentConsultationDocumentVersionResponseDto implements Document {
  @ApiProperty({ format: 'uuid' }) readonly id!: string
  @ApiProperty() readonly title!: string
  @ApiPropertyOptional({ format: 'uuid' }) readonly currentVersionId?: string
  @ApiProperty() readonly createdAt!: Date
  @ApiProperty() readonly updatedAt!: Date

  static fromDomain(
    document: Document,
  ): SelectCurrentConsultationDocumentVersionResponseDto {
    return document
  }
}
