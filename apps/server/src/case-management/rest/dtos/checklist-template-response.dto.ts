import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

import { ChecklistTemplateItemResponseDto } from './checklist-template-item-response.dto'

export class ChecklistTemplateResponseDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  legalAreaId!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  isActive!: boolean

  @ApiProperty({ type: [ChecklistTemplateItemResponseDto] })
  items!: ChecklistTemplateItemResponseDto[]

  @ApiProperty()
  updatedAt!: Date

  @ApiPropertyOptional()
  updatedBy?: string
}
