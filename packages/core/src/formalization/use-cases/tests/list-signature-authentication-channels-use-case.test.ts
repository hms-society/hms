import { describe, expect, it } from 'vitest'
import { ListSignatureAuthenticationChannelsUseCase } from '../list-signature-authentication-channels-use-case'

describe('List Signature Authentication Channels Use Case', () => {
  it('exposes the contracted execute operation', () => {
    expect(ListSignatureAuthenticationChannelsUseCase).toBeTypeOf('function')
    expect(ListSignatureAuthenticationChannelsUseCase.prototype.execute).toBeTypeOf('function')
  })
})
