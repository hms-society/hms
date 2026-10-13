import { ApiProperty } from '@nestjs/swagger'

export class AdminLegalCaseOperationalSummaryResponseDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  publicCode!: string

  @ApiProperty()
  title!: string

  @ApiProperty()
  clientName!: string

  @ApiProperty()
  legalArea!: string

  @ApiProperty()
  legalTopic!: string

  @ApiProperty({
    enum: [
      'documentation',
      'ready_for_legal_production',
      'legal_production',
      'protocol_delivery',
      'execution',
      'closed',
    ],
  })
  status!: string

  @ApiProperty({ type: [String] })
  managerNames!: string[]

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string
}
