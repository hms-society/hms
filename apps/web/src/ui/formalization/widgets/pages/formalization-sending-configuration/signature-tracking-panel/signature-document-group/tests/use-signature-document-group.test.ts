import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useSignatureDocumentGroup } from '../use-signature-document-group'

describe('useSignatureDocumentGroup', () => {
  it('sorts signatories by recipient id', () => {
    const { result } = renderHook(() =>
      useSignatureDocumentGroup({
        document: {
          status: 'delivery_pending',
          signatories: [
            { recipientId: 'z', displayName: 'Zed' },
            { recipientId: 'a', displayName: 'Ana' },
          ],
        } as never,
        isResending: false,
        onRequestResend: () => undefined,
      }),
    )

    expect(result.current.signatories.map((item) => item.recipientId)).toEqual(['a', 'z'])
  })
})
