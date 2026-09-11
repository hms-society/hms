import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ChecklistDocumentType } from '@hms/core/case-management/domain/structures'

export class ChecklistTemplateItemResponseDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  checklistTemplateId!: string

  @ApiProperty()
  title!: string

  @ApiProperty({ enum: ChecklistDocumentType, isArray: true })
  documentTypes!: string[]

  @ApiProperty()
  isRequired!: boolean

  @ApiProperty()
  position!: number

  @ApiProperty()
  updatedAt!: Date

  @ApiPropertyOptional()
  updatedBy?: string
}
