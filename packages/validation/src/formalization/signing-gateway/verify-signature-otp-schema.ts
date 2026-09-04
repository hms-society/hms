import { z } from 'zod'

export const verifySignatureOtpSchema = z.strictObject({
  challengeId: z.string().uuid(),
  code: z.string().regex(/^[0-9]{6}$/),
})

export type VerifySignatureOtpInput = z.infer<typeof verifySignatureOtpSchema>
