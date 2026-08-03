import { z } from 'zod'

import {
  administrativeCollaboratorProfileSchema,
  legalCollaboratorProfileSchema,
} from './collaborator-profile-schema'
import { legalExpertisesSchema } from './legal-expertise-schema'

const emailSchema = z.string().trim().toLowerCase().pipe(z.email())
const professionalNameSchema = z.string().trim().min(1)
const optionalTextSchema = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional()

const registrationBase = {
  email: emailSchema,
  professionalName: professionalNameSchema,
  jobTitle: optionalTextSchema,
}

const administrativeRegistrationSchema = z
  .object({
    ...registrationBase,
    profile: administrativeCollaboratorProfileSchema,
  })
  .strict()

const legalRegistrationSchema = z
  .object({
    ...registrationBase,
    profile: legalCollaboratorProfileSchema,
    legalExpertises: legalExpertisesSchema,
  })
  .strict()

export const registerCollaboratorSchema = z.discriminatedUnion('profile', [
  administrativeRegistrationSchema,
  legalRegistrationSchema,
])
