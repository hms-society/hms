import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class DynamicFormNameConflictResponseDto {
  @ApiProperty() conflict!: boolean
  @ApiPropertyOptional({ format: 'uuid' }) existingDynamicFormId?: string
}
