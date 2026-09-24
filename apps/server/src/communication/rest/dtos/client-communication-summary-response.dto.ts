import { ApiProperty } from '@nestjs/swagger'

export class ClientCommunicationSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  clientId!: string

  @ApiProperty()
  inboundCount!: number

  @ApiProperty()
  isLastMessageInbound!: boolean
}
