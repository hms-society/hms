import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type {
  Document,
  DocumentGeneration,
  DocumentVersion,
} from '@hms/core/document-production/domain/entities'

class CaseDocumentPendingVariableResponseDto {
  @ApiProperty() marker!: string
  @ApiProperty() technicalName!: string
  @ApiProperty() label!: string
}

class CaseDocumentReferenceDocumentResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() fileName!: string
  @ApiPropertyOptional() checklistItemLabel?: string
}

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
  @ApiPropertyOptional() storagePath?: string
  @ApiProperty({ type: [CaseDocumentPendingVariableResponseDto] })
  pendingVariables!: CaseDocumentPendingVariableResponseDto[]
}

class CaseDocumentGenerationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() status!: DocumentGeneration['status']
  @ApiPropertyOptional() failureMessage?: string
  @ApiPropertyOptional() completedAt?: Date
  @ApiPropertyOptional() failedAt?: Date
  @ApiProperty({ type: [CaseDocumentReferenceDocumentResponseDto] })
  referenceDocuments!: CaseDocumentReferenceDocumentResponseDto[]
}

export class CaseDocumentResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() title!: string
  @ApiPropertyOptional({ format: 'uuid' }) currentVersionId?: string
  @ApiProperty({ type: [CaseDocumentVersionResponseDto] })
  versions!: CaseDocumentVersionResponseDto[]
  @ApiPropertyOptional({ type: CaseDocumentGenerationResponseDto })
  generation?: CaseDocumentGenerationResponseDto

  static fromDomain(input: {
    document: Document
    versions: readonly DocumentVersion[]
    generation?: DocumentGeneration
  }): CaseDocumentResponseDto {
    return {
      id: input.document.id,
      title: input.document.title,
      currentVersionId: input.document.currentVersionId,
      versions: input.versions.map((version) => ({
        id: version.id,
        versionNumber: version.versionNumber,
        source: version.source,
        status: version.status,
        createdAt: version.createdAt,
        createdByCollaboratorId: version.createdByCollaboratorId,
        reviewedAt: version.reviewedAt,
        rejectionReason: version.rejectionReason,
        content: version.content,
        storagePath: version.storagePath,
        pendingVariables: CaseDocumentResponseDto.mapPendingVariables(
          version,
          input.generation && input.generation.id === version.documentGenerationId
            ? input.generation.template.variables
            : [],
        ),
      })),
      ...(input.generation
        ? {
            generation: {
              id: input.generation.id,
              status: input.generation.status,
              failureMessage: input.generation.failureMessage,
              completedAt: input.generation.completedAt,
              failedAt: input.generation.failedAt,
              referenceDocuments: CaseDocumentResponseDto.mapReferenceDocuments(
                input.generation.source.data.referenceDocuments,
              ),
            },
          }
        : {}),
    }
  }

  private static mapPendingVariables(
    version: DocumentVersion,
    templateVariables: DocumentGeneration['template']['variables'],
  ): CaseDocumentPendingVariableResponseDto[] {
    return version.pendingMarkers.map(({ marker }) => {
      const technicalName = marker.replace(/^\{|\}$/g, '')
      const variable = templateVariables.find(
        (item) => item.technicalName === technicalName,
      )

      return {
        marker,
        technicalName,
        label: variable?.label ?? technicalName.replaceAll('_', ' '),
      }
    })
  }

  private static mapReferenceDocuments(
    value: unknown,
  ): CaseDocumentReferenceDocumentResponseDto[] {
    if (!Array.isArray(value)) return []

    return value.flatMap((item) => {
      if (
        typeof item !== 'object' ||
        item === null ||
        !('id' in item) ||
        typeof item.id !== 'string' ||
        !('fileName' in item) ||
        typeof item.fileName !== 'string'
      ) {
        return []
      }

      return [
        {
          id: item.id,
          fileName: item.fileName,
          ...('checklistItemLabel' in item && typeof item.checklistItemLabel === 'string'
            ? { checklistItemLabel: item.checklistItemLabel }
            : {}),
        },
      ]
    })
  }
}
