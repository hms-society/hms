import { ApiProperty } from '@nestjs/swagger'

import { CollaboratorSummaryResponseDto } from './collaborator-summary-response.dto'

export class CollaboratorsPageResponseDto {
  @ApiProperty({ type: () => [CollaboratorSummaryResponseDto] })
  items!: CollaboratorSummaryResponseDto[]

  @ApiProperty()
  page!: number

  @ApiProperty()
  pageSize!: number

  @ApiProperty()
  total!: number

  @ApiProperty()
  totalPages!: number
}
