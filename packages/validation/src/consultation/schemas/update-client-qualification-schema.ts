import { z } from 'zod'

export const updateClientQualificationSchema = z.object({
  name: z.string().optional(),
  legalName: z.string().optional(),
  tradeName: z.string().optional(),
  taxIdValue: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  origin: z.string().optional(),
  linkedThirdParty: z.string().optional(),
  hmsResponsible: z.string().optional(),
  rg: z.string().optional(),
  birthDate: z.string().optional(),
  maritalStatus: z.string().optional(),
  nationality: z.string().optional(),
  profession: z.string().optional(),
  stateRegistration: z.string().optional(),
  constitutionDate: z.string().optional(),
  legalNature: z.string().optional(),
  legalRepresentative: z.string().optional(),
  representativeRole: z.string().optional(),
  zipCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
})

export type UpdateClientQualificationInput = z.infer<
  typeof updateClientQualificationSchema
>
