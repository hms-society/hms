import { describe, expect, it } from 'vitest'
import { ReconcileFormalizationSignatureInvitationDeliveriesUseCase } from '../reconcile-formalization-signature-invitation-deliveries-use-case'

describe('Reconcile Formalization Signature Invitation Deliveries Use Case', () => {
  it('exposes the contracted execute operation', () => {
    expect(ReconcileFormalizationSignatureInvitationDeliveriesUseCase).toBeTypeOf('function')
    expect(ReconcileFormalizationSignatureInvitationDeliveriesUseCase.prototype.execute).toBeTypeOf('function')
  })
})
