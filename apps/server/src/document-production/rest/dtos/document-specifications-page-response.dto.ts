import { ApiProperty } from '@nestjs/swagger'

import { DocumentSpecificationListItemResponseDto } from './document-specification-list-item-response.dto'

export class DocumentSpecificationsPageResponseDto {
  @ApiProperty({ type: () => [DocumentSpecificationListItemResponseDto] })
  items!: DocumentSpecificationListItemResponseDto[]
  @ApiProperty() page!: number
  @ApiProperty() pageSize!: number
  @ApiProperty() total!: number
  @ApiProperty() totalPages!: number
}
