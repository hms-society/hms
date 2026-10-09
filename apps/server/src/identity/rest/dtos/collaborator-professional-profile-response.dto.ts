import { ApiProperty } from '@nestjs/swagger'
import type { CollaboratorProfessionalProfile } from '@hms/core/identity/domain/structures'
import {
  CollaboratorProfile as CollaboratorProfiles,
  type CollaboratorProfile,
} from '@hms/core/identity/domain/structures'

import { CollaboratorLegalExpertiseResponseDto } from './collaborator-summary-response.dto'

export class CollaboratorProfessionalProfileResponseDto
  implements CollaboratorProfessionalProfile
{
  @ApiProperty({ format: 'uuid' })
  collaboratorId!: string

  @ApiProperty()
  professionalName!: string

  @ApiProperty({ format: 'email' })
  email!: string

  @ApiProperty({ enum: Object.values(CollaboratorProfiles) })
  profile!: CollaboratorProfile

  @ApiProperty({ type: () => [CollaboratorLegalExpertiseResponseDto] })
  legalExpertises!: CollaboratorLegalExpertiseResponseDto[]
}
