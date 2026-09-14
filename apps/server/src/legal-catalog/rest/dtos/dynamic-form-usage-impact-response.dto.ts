import type { DynamicFormUsageImpact } from '@hms/core/legal-catalog/domain/structures'
import { ApiProperty } from '@nestjs/swagger'

export class DynamicFormUsageImpactResponseDto {
  @ApiProperty({ type: Object }) consultation!: DynamicFormUsageImpact['consultation']
  @ApiProperty({ type: Object }) formalization!: DynamicFormUsageImpact['formalization']

  static fromDomain(input: DynamicFormUsageImpact): DynamicFormUsageImpactResponseDto {
    const response = new DynamicFormUsageImpactResponseDto()
    Object.assign(response, input)
    return response
  }
}
