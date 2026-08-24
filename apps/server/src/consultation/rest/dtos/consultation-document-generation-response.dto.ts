import { ApiProperty } from '@nestjs/swagger'
import type { ConsultationDocumentGeneration } from '@hms/core/consultation/domain/structures'

export class ConsultationDocumentGenerationResponseDto
  implements ConsultationDocumentGeneration
{
  @ApiProperty({ format: 'uuid' })
  readonly documentGenerationId!: string

  @ApiProperty({ format: 'uuid' })
  readonly documentId!: string

  static fromDomain(
    generation: ConsultationDocumentGeneration,
  ): ConsultationDocumentGenerationResponseDto {
    return generation
  }
}
