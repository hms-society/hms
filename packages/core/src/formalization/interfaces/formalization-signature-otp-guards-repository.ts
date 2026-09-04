import type { FormalizationSignatureOtpGuardChanges } from '../domain/structures'
import type { FormalizationSignatureOtpGuard } from '../domain/structures/formalization-signature-otp-guard'

export interface FormalizationSignatureOtpGuardsRepository {
  add(guard: FormalizationSignatureOtpGuard): Promise<void>
  findByInvitationId(invitationId: string): Promise<FormalizationSignatureOtpGuard | null>
  replace(input: {
    invitationId: string
    changes: FormalizationSignatureOtpGuardChanges
  }): Promise<void>
}
