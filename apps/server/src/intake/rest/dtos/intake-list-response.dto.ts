import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IntakeListStatus } from '@hms/core/intake/domain/structures'

export class IntakeListClientResponseDto {
  @ApiProperty()
  clientId!: string

  @ApiProperty()
  name!: string

  @ApiProperty({ description: 'CPF/CNPJ with its sensitive digits masked.' })
  maskedTaxId!: string
}

export class IntakeListResponsibleResponseDto {
  @ApiProperty()
  responsibleId!: string

  @ApiProperty()
  professionalName!: string
}

export class IntakeListItemResponseDto {
  @ApiProperty()
  intakeId!: string

  @ApiProperty({ example: 'INT-0142' })
  displayId!: string

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date

  @ApiProperty({ type: () => IntakeListClientResponseDto })
  client!: IntakeListClientResponseDto

  @ApiProperty({ type: () => IntakeListResponsibleResponseDto })
  responsible!: IntakeListResponsibleResponseDto

  @ApiPropertyOptional()
  demandNotes?: string

  @ApiProperty()
  origin!: string

  @ApiProperty()
  contactChannel!: string

  @ApiProperty({ enum: IntakeListStatus })
  status!: string
}

export class IntakeListStatusCountsResponseDto {
  @ApiProperty()
  all!: number

  @ApiProperty({ enum: IntakeListStatus, type: Object })
  byStatus!: Record<string, number>

  @ApiProperty({ type: Object, example: { registered: 0 } })
  compatibility!: { registered: number }
}

export class IntakeListPageResponseDto {
  @ApiProperty({ type: () => [IntakeListItemResponseDto] })
  items!: IntakeListItemResponseDto[]

  @ApiProperty()
  page!: number

  @ApiProperty()
  pageSize!: number

  @ApiProperty()
  total!: number

  @ApiProperty()
  totalPages!: number

  @ApiProperty({ type: () => IntakeListStatusCountsResponseDto })
  statusCounts!: IntakeListStatusCountsResponseDto
}
