import { ApiProperty } from '@nestjs/swagger'

export class CaseDocumentGenerationResponseDto {
  @ApiProperty({ format: 'uuid' }) documentGenerationId!: string
  @ApiProperty({ format: 'uuid' }) documentId!: string
}
