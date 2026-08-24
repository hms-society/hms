import type { DocumentPackage } from '@hms/core/document-production/domain/entities'
import { ApiProperty } from '@nestjs/swagger'

export class ConsultationDocumentPackageConfirmationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() confirmedAt!: Date
  @ApiProperty({ format: 'uuid' }) confirmedByCollaboratorId!: string

  static fromDomain(input: DocumentPackage) {
    return {
      id: input.id,
      confirmedAt: input.confirmedAt,
      confirmedByCollaboratorId: input.confirmedByCollaboratorId,
    }
  }
}
