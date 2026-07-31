import { z } from 'zod'

import {
  administrativeCollaboratorProfileSchema,
  legalCollaboratorProfileSchema,
} from './collaborator-profile-schema'
import { legalExpertisesSchema } from './legal-expertise-schema'

const professionalNameSchema = z.string().trim().min(1)
const optionalTextSchema = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional()

const updateBase = {
  professionalName: professionalNameSchema,
  jobTitle: optionalTextSchema,
}

const administrativeUpdateSchema = z
  .object({
    ...updateBase,
    profile: administrativeCollaboratorProfileSchema,
  })
  .strict()

const legalUpdateSchema = z
  .object({
    ...updateBase,
    profile: legalCollaboratorProfileSchema,
    legalExpertises: legalExpertisesSchema,
  })
  .strict()

export const updateCollaboratorSchema = z.discriminatedUnion('profile', [
  administrativeUpdateSchema,
  legalUpdateSchema,
])
