import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { DocumentVersion } from '@hms/core/document-production/domain/entities'

export class ConsultationDocumentVersionResponseDto implements DocumentVersion {
  @ApiProperty({ format: 'uuid' }) readonly id!: string
  @ApiProperty({ format: 'uuid' }) readonly documentId!: string
  @ApiPropertyOptional({ format: 'uuid' }) readonly documentGenerationId?: string
  @ApiPropertyOptional({ format: 'uuid' }) readonly sourceDocumentVersionId?: string
  @ApiProperty({ format: 'uuid' }) readonly fileId!: string
  @ApiProperty() readonly versionNumber!: number
  @ApiProperty() readonly source!: DocumentVersion['source']
  @ApiProperty() readonly content!: DocumentVersion['content']
  @ApiProperty() readonly pendingMarkers!: DocumentVersion['pendingMarkers']
  @ApiProperty({ format: 'uuid' }) readonly createdByCollaboratorId!: string
  @ApiProperty() readonly createdAt!: Date
  @ApiProperty() readonly status!: DocumentVersion['status']
  @ApiPropertyOptional({ format: 'uuid' }) readonly reviewedByCollaboratorId?: string
  @ApiPropertyOptional() readonly reviewedAt?: Date
  @ApiPropertyOptional() readonly rejectionReason?: string

  static fromDomain(version: DocumentVersion): ConsultationDocumentVersionResponseDto {
    return version
  }
}
