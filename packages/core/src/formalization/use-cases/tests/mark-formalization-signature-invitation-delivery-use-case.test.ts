import { describe, expect, it } from 'vitest'
import { MarkFormalizationSignatureInvitationDeliveryUseCase } from '../mark-formalization-signature-invitation-delivery-use-case'

describe('Mark Formalization Signature Invitation Delivery Use Case', () => {
  it('exposes the contracted execute operation', () => {
    expect(MarkFormalizationSignatureInvitationDeliveryUseCase).toBeTypeOf('function')
    expect(MarkFormalizationSignatureInvitationDeliveryUseCase.prototype.execute).toBeTypeOf('function')
  })
})
