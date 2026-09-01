import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type {
  Document,
  DocumentVersion,
} from '@hms/core/document-production/domain/entities'
import {
  DocumentGenerationStatus,
  type DocumentGenerationStatus as DocumentGenerationStatusValue,
} from '@hms/core/document-production/domain/structures'

class ConsultationDocumentVersionSummaryDto {
  @ApiProperty({ format: 'uuid' }) readonly id!: string
  @ApiProperty() readonly versionNumber!: number
  @ApiProperty() readonly source!: DocumentVersion['source']
  @ApiProperty() readonly status!: DocumentVersion['status']
  @ApiProperty() readonly pendingMarkersCount!: number
  @ApiProperty({ format: 'uuid' }) readonly createdByCollaboratorId!: string
  @ApiProperty() readonly createdAt!: Date
  @ApiPropertyOptional({ format: 'uuid' }) readonly reviewedByCollaboratorId?: string
  @ApiPropertyOptional() readonly reviewedAt?: Date
  @ApiPropertyOptional() readonly rejectionReason?: string
}

export class ListConsultationDocumentsResponseDto {
  @ApiProperty({ format: 'uuid' }) readonly id!: string
  @ApiProperty() readonly title!: string
  @ApiPropertyOptional({ format: 'uuid' }) readonly currentVersionId?: string
  @ApiPropertyOptional({ enum: Object.values(DocumentGenerationStatus) })
  readonly generationStatus?: DocumentGenerationStatusValue
  @ApiPropertyOptional({
    enum: ['INTERNO', 'CLIENTE', 'RESTRITO', 'CONFIDENCIAL', 'PARCEIRO_LIBERADO'],
  })
  readonly classificacaoAcesso?:
    | 'INTERNO'
    | 'CLIENTE'
    | 'RESTRITO'
    | 'CONFIDENCIAL'
    | 'PARCEIRO_LIBERADO'
  @ApiProperty({ type: [ConsultationDocumentVersionSummaryDto] })
  readonly versions!: readonly ConsultationDocumentVersionSummaryDto[]

  static fromDomain(input: {
    readonly document: Document
    readonly generationStatus?: DocumentGenerationStatusValue
    readonly versions: readonly DocumentVersion[]
  }): ListConsultationDocumentsResponseDto {
    return {
      id: input.document.id,
      title: input.document.title,
      currentVersionId: input.document.currentVersionId,
      generationStatus: input.generationStatus,
      classificacaoAcesso: input.document.classificacaoAcesso,
      versions: input.versions.map((version) => ({
        id: version.id,
        versionNumber: version.versionNumber,
        source: version.source,
        status: version.status,
        pendingMarkersCount: version.pendingMarkers.length,
        createdByCollaboratorId: version.createdByCollaboratorId,
        createdAt: version.createdAt,
        reviewedByCollaboratorId: version.reviewedByCollaboratorId,
        reviewedAt: version.reviewedAt,
        rejectionReason: version.rejectionReason,
      })),
    }
  }
}
