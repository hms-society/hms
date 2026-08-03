import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

class LegalExpertiseUpdateRequestDto {
  @ApiProperty({ format: 'uuid' })
  legalAreaId!: string

  @ApiProperty({ type: [String], format: 'uuid' })
  legalTopicIds!: readonly string[]
}

export class UpdateCollaboratorRequestDto {
  @ApiProperty()
  professionalName!: string

  @ApiPropertyOptional()
  jobTitle?: string

  @ApiProperty({ enum: ['admin', 'attendant', 'lawyer', 'paralegal', 'supervisor'] })
  profile!: string

  @ApiPropertyOptional({ type: () => [LegalExpertiseUpdateRequestDto] })
  legalExpertises?: readonly LegalExpertiseUpdateRequestDto[]
}
