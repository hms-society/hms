import type { DocumentSpecification } from '@hms/core/document-production/domain/entities'
import type { DocumentSpecificationDetails } from '@hms/core/document-production/domain/structures'
import type {
  DocumentGenerationMoment,
  DocumentSpecificationStatus,
} from '@hms/core/document-production/domain/structures'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

class DocumentSpecificationApplicationResponseDto {
  @ApiProperty({ enum: ['global', 'legal_context'] })
  scope!: string

  @ApiProperty({ enum: ['consultation', 'formalization', 'legal_production'] })
  moment!: DocumentGenerationMoment

  @ApiPropertyOptional({ format: 'uuid', isArray: true })
  legalAreaIds!: string[]

  @ApiPropertyOptional({
    format: 'uuid',
    type: 'object',
    additionalProperties: { type: 'array', items: { format: 'uuid', type: 'string' } },
  })
  legalTopicIdsByArea!: Record<string, string[]>
}

class DocumentSpecificationVariableResponseDto {
  @ApiProperty()
  label!: string

  @ApiProperty()
  technicalName!: string

  @ApiPropertyOptional()
  description?: string
}

export class DocumentSpecificationResponseDto {
  @ApiProperty({ format: 'uuid' })
  documentSpecificationId!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  description!: string

  @ApiProperty({ type: () => DocumentSpecificationApplicationResponseDto })
  application!: DocumentSpecification['application']

  @ApiProperty({ enum: ['Interno', 'Cliente', 'Restrito', 'Confidencial', 'Parceiro liberado'] })
  accessClassification!: string

  @ApiProperty({ type: 'object', additionalProperties: true })
  content!: DocumentSpecification['content']

  @ApiProperty({ type: () => [DocumentSpecificationVariableResponseDto] })
  variables!: DocumentSpecification['variables']

  @ApiProperty({ enum: ['available', 'unavailable'] })
  status!: DocumentSpecificationStatus

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string

  static fromDomain(entity: DocumentSpecification): DocumentSpecificationResponseDto {
    const response = new DocumentSpecificationResponseDto()
    const details: DocumentSpecificationDetails = {
      documentSpecificationId: entity.id,
      name: entity.name,
      description: entity.description,
      application: entity.application,
      accessClassification: entity.accessClassification, // NOVO: Mapeamento do domínio para a resposta
      content: entity.content,
      variables: entity.variables,
      status: entity.status,
      updatedAt: entity.updatedAt.toISOString(),
    }

    Object.assign(response, details)
    return response
  }
}