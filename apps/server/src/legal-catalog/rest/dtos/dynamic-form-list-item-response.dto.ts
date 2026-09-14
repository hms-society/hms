import type { DynamicFormListItem } from '@hms/core/legal-catalog/domain/structures'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class DynamicFormListItemResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() name!: string
  @ApiPropertyOptional({ nullable: true }) description!: string | null
  @ApiProperty({ enum: ['available', 'unavailable'] })
  status!: DynamicFormListItem['status']
  @ApiProperty({ enum: ['consultation', 'formalization'] })
  stage!: DynamicFormListItem['stage']
  @ApiProperty({ type: Object }) legalArea!: DynamicFormListItem['legalArea']
  @ApiProperty({ type: 'array', items: { type: 'object', additionalProperties: true } })
  legalTopics!: DynamicFormListItem['legalTopics']
  @ApiProperty() fieldCount!: number

  static fromDomain(input: DynamicFormListItem): DynamicFormListItemResponseDto {
    const response = new DynamicFormListItemResponseDto()
    Object.assign(response, input)
    return response
  }
}
