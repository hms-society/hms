import { z } from 'zod'

export const requestSignatureOtpSchema = z.strictObject({
  channelChoiceId: z.string().uuid(),
})

export type RequestSignatureOtpInput = z.infer<typeof requestSignatureOtpSchema>
