import type {
  FormalizationSignatureInvitation,
  FormalizationSignatureInvitationSendAttempt,
} from '../domain/entities'
import type {
  FormalizationSignatureGatewaySessionChanges,
  FormalizationSignatureInvitationChanges,
  FormalizationSignatureProxyBindingChanges,
  FormalizationSignatureRecipientChanges,
} from '../domain/structures'

export interface FormalizationSignatureInvitationResendTransaction {
  resend(input: {
    readonly requestId: string
    readonly recipientId: string
    readonly expectedRecipientVersion: number
    readonly recipientChanges: FormalizationSignatureRecipientChanges
    readonly previousInvitationId: string
    readonly expectedInvitationGeneration: number
    readonly previousInvitationChanges: FormalizationSignatureInvitationChanges
    readonly sessionIdsToRevoke: readonly string[]
    readonly sessionChanges: FormalizationSignatureGatewaySessionChanges
    readonly bindingIdsToRevoke: readonly string[]
    readonly bindingChanges: FormalizationSignatureProxyBindingChanges
    readonly invitation: FormalizationSignatureInvitation
    readonly sendAttempt: FormalizationSignatureInvitationSendAttempt
    readonly audit: {
      readonly action: 'invitation_resent'
      readonly actorReference: string
      readonly occurredAt: Date
      readonly correlationId: string
      readonly metadata: Readonly<Record<string, string | number | boolean | null>>
    }
  }): Promise<'applied' | 'conflict'>
}
