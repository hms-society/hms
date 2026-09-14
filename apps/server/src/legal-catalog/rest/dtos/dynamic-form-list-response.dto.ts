import type { DynamicFormListResult } from '@hms/core/legal-catalog/domain/structures'
import { ApiProperty } from '@nestjs/swagger'
import { DynamicFormListItemResponseDto } from './dynamic-form-list-item-response.dto'

export class DynamicFormListResponseDto {
  @ApiProperty({ type: [DynamicFormListItemResponseDto] })
  items!: DynamicFormListItemResponseDto[]
  @ApiProperty() page!: number
  @ApiProperty({ default: 5 }) pageSize!: 5
  @ApiProperty() total!: number
  @ApiProperty() pageCount!: number

  static fromDomain(input: DynamicFormListResult): DynamicFormListResponseDto {
    const response = new DynamicFormListResponseDto()
    Object.assign(response, input, {
      items: input.items.map(DynamicFormListItemResponseDto.fromDomain),
    })
    return response
  }
}
