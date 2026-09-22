import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { Pending } from '@hms/core/case-management/domain/entities'

export class PendingResponseDto implements Pending {
  @ApiProperty() id!: string
  @ApiProperty() caseId!: string
  @ApiProperty() checklistItemId!: string
  @ApiPropertyOptional() documentFileId?: string
  @ApiPropertyOptional() documentFileName?: string
  @ApiProperty() reason!: Pending['reason']
  @ApiPropertyOptional() details?: string
  @ApiProperty() responsibleId!: string
  @ApiProperty() createdAt!: Date
  @ApiPropertyOptional() cancelledAt?: Date
  @ApiPropertyOptional() cancelledBy?: string
}
