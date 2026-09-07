import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CaseChecklistItemResponseDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  caseId!: string

  @ApiProperty()
  templateItemKey!: string

  @ApiProperty()
  title!: string

  @ApiProperty()
  isRequired!: boolean

  @ApiProperty()
  status!: string

  @ApiPropertyOptional()
  documentFileId?: string

  @ApiPropertyOptional()
  documentFileName?: string

  @ApiPropertyOptional()
  validatedAt?: Date

  @ApiPropertyOptional()
  validatedBy?: string

  @ApiProperty()
  createdAt!: Date

  @ApiProperty()
  updatedAt!: Date
}
