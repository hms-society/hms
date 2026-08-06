import { CollaboratorProfile } from '@hms/core/identity/domain/structures'
import { z } from 'zod'

export const collaboratorProfileSchema = z.enum(CollaboratorProfile)

export const administrativeCollaboratorProfileSchema = z.enum([
  CollaboratorProfile.Admin,
  CollaboratorProfile.Attendant,
  CollaboratorProfile.Client,
])

export const legalCollaboratorProfileSchema = z.enum([
  CollaboratorProfile.Lawyer,
  CollaboratorProfile.Paralegal,
  CollaboratorProfile.Supervisor,
])
