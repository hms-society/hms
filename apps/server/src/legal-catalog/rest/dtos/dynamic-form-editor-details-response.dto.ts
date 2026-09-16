import type { DynamicFormEditorDetails } from '@hms/core/legal-catalog/domain/structures'
import { ApiProperty } from '@nestjs/swagger'

import { DynamicFormAdministrationResponseDto } from './dynamic-form-administration-response.dto'

export class DynamicFormEditorDetailsResponseDto {
  @ApiProperty({ type: DynamicFormAdministrationResponseDto })
  form!: DynamicFormAdministrationResponseDto

  @ApiProperty({ type: Object }) legalArea!: DynamicFormEditorDetails['legalArea']

  @ApiProperty({ type: [Object] }) legalTopics!: DynamicFormEditorDetails['legalTopics']

  static fromDomain(
    input: DynamicFormEditorDetails,
  ): DynamicFormEditorDetailsResponseDto {
    const response = new DynamicFormEditorDetailsResponseDto()
    Object.assign(response, {
      form: DynamicFormAdministrationResponseDto.fromDomain(input.form),
      legalArea: input.legalArea,
      legalTopics: input.legalTopics,
    })
    return response
  }
}
