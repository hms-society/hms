import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { Document, DocumentVersion } from '@hms/core/document-production/domain/entities'

class CaseDocumentVersionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() versionNumber!: number
  @ApiProperty() source!: DocumentVersion['source']
  @ApiProperty() status!: DocumentVersion['status']
  @ApiProperty() createdAt!: Date
  @ApiProperty({ format: 'uuid' }) createdByCollaboratorId!: string
  @ApiPropertyOptional() reviewedAt?: Date
  @ApiPropertyOptional() rejectionReason?: string
  @ApiPropertyOptional() content?: DocumentVersion['content']
}

export class CaseDocumentResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() title!: string
  @ApiPropertyOptional({ format: 'uuid' }) currentVersionId?: string
  @ApiProperty({ type: [CaseDocumentVersionResponseDto] }) versions!: CaseDocumentVersionResponseDto[]

  static fromDomain(input: { document: Document; versions: readonly DocumentVersion[] }): CaseDocumentResponseDto {
    return { id: input.document.id, title: input.document.title, currentVersionId: input.document.currentVersionId, versions: input.versions.map((version) => ({ id: version.id, versionNumber: version.versionNumber, source: version.source, status: version.status, createdAt: version.createdAt, createdByCollaboratorId: version.createdByCollaboratorId, reviewedAt: version.reviewedAt, rejectionReason: version.rejectionReason, content: version.content })) }
  }
}
