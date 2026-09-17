import type { DynamicFormUsageImpact } from '@hms/core/legal-catalog/domain/structures'
import { ApiProperty } from '@nestjs/swagger'

export class DynamicFormFieldUsageImpactResponseDto {
  @ApiProperty({ type: Object }) formalization!: DynamicFormUsageImpact['formalization']

  static fromDomain(
    input: DynamicFormUsageImpact,
  ): DynamicFormFieldUsageImpactResponseDto {
    const response = new DynamicFormFieldUsageImpactResponseDto()
    Object.assign(response, input)
    return response
  }
}
