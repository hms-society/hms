import type { DynamicForm } from '@hms/core/legal-catalog/domain/entities'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class DynamicFormAdministrationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() name!: string
  @ApiPropertyOptional({ nullable: true }) description!: string | null
  @ApiProperty({ enum: ['available', 'unavailable'] }) status!: DynamicForm['status']
  @ApiProperty({ enum: ['consultation', 'formalization'] }) stage!: DynamicForm['stage']
  @ApiProperty({ format: 'uuid' }) legalAreaId!: string
  @ApiProperty({ type: [String], format: 'uuid' }) legalTopicIds!: string[]
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  fields!: DynamicForm['fields']
  @ApiProperty({ minimum: 1 }) version!: number
  @ApiProperty({ format: 'date-time' }) createdAt!: Date
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date

  static fromDomain(input: DynamicForm): DynamicFormAdministrationResponseDto {
    const response = new DynamicFormAdministrationResponseDto()
    Object.assign(response, input)
    return response
  }
}
