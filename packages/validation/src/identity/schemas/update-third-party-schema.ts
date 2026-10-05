import { registerThirdPartyRequestSchema } from './register-third-party-schema'

export const updateThirdPartyRequestSchema = registerThirdPartyRequestSchema
  .partial()
  .strict()
