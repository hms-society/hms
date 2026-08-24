import type { DynamicForm } from '@hms/core/shared/domain'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class DynamicFormResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() name!: string
  @ApiPropertyOptional() description?: string
  @ApiProperty({ enum: ['available', 'unavailable'] }) status!: DynamicForm['status']
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  contexts!: DynamicForm['contexts']
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  fields!: DynamicForm['fields']
  @ApiProperty({ format: 'date-time' }) createdAt!: Date
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date

  static fromDomain(input: DynamicForm): DynamicFormResponseDto {
    const response = new DynamicFormResponseDto()
    Object.assign(response, input)
    return response
  }
}
