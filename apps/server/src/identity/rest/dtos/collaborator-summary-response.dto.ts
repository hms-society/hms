import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { CollaboratorLegalExpertiseProjection } from '@hms/core/identity/domain/entities'
import type {
  CollaboratorProfile,
  UserStatus,
} from '@hms/core/identity/domain/structures'
import {
  CollaboratorProfile as CollaboratorProfiles,
  UserStatus as UserStatuses,
} from '@hms/core/identity/domain/structures'

export class LegalAreaProjectionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  active!: boolean
}

export class LegalTopicProjectionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  active!: boolean
}

export class CollaboratorLegalExpertiseResponseDto {
  @ApiProperty({ type: () => LegalAreaProjectionResponseDto })
  legalArea!: LegalAreaProjectionResponseDto

  @ApiProperty({ type: () => [LegalTopicProjectionResponseDto] })
  legalTopics!: LegalTopicProjectionResponseDto[]
}

export class CollaboratorSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  collaboratorId!: string

  @ApiProperty()
  professionalName!: string

  @ApiProperty({ format: 'email' })
  email!: string

  @ApiProperty({ enum: Object.values(CollaboratorProfiles) })
  profile!: CollaboratorProfile

  @ApiPropertyOptional()
  jobTitle?: string

  @ApiProperty({ enum: Object.values(UserStatuses) })
  status!: UserStatus

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  lastAccessAt?: Date

  @ApiPropertyOptional({ type: () => [CollaboratorLegalExpertiseResponseDto] })
  legalExpertises?: CollaboratorLegalExpertiseProjection[]
}
