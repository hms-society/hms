import { z } from 'zod'

import { consentTypeSchema } from './consent-type-schema'

export const grantClientConsentSchema = z
  .object({
    type: consentTypeSchema,
  })
  .strict()
