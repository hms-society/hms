import { ApiProperty } from '@nestjs/swagger'

import { AdminLegalCaseOperationalSummaryResponseDto } from '@/case-management/rest/dtos/admin-legal-case-operational-summary-response.dto'

export class AdminLegalCasesPageResponseDto {
  @ApiProperty({ type: [AdminLegalCaseOperationalSummaryResponseDto] })
  items!: AdminLegalCaseOperationalSummaryResponseDto[]

  @ApiProperty()
  page!: number

  @ApiProperty()
  pageSize!: number

  @ApiProperty()
  total!: number

  @ApiProperty()
  totalPages!: number
}
