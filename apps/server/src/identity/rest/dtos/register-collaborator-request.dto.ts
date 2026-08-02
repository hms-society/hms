import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

class LegalExpertiseRequestDto {
  @ApiProperty({ format: 'uuid' })
  legalAreaId!: string

  @ApiProperty({ type: [String], format: 'uuid' })
  legalTopicIds!: readonly string[]
}

export class RegisterCollaboratorRequestDto {
  @ApiProperty({ format: 'email' })
  email!: string

  @ApiProperty()
  professionalName!: string

  @ApiPropertyOptional()
  jobTitle?: string

  @ApiProperty({ enum: ['admin', 'attendant', 'lawyer', 'paralegal', 'supervisor'] })
  profile!: string

  @ApiPropertyOptional({ type: () => [LegalExpertiseRequestDto] })
  legalExpertises?: readonly LegalExpertiseRequestDto[]
}
