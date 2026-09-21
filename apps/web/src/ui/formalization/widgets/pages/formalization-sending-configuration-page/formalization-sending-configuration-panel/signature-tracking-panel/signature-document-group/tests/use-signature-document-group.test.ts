import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useSignatureDocumentGroup } from '../use-signature-document-group'

describe('useSignatureDocumentGroup', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

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
        canViewDocuments: false,
        isSignatureRequestConfirmed: false,
        onGetDocumentContent: async () => new Blob(),
      }),
    )

    expect(result.current.signatories.map((item) => item.recipientId)).toEqual(['a', 'z'])
  })

  it('keeps the object URL available after opening a document', async () => {
    const content = new Blob(['document'], { type: 'application/pdf' })
    const createObjectUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:http://localhost/document')
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL')
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)
    const onGetDocumentContent = vi.fn().mockResolvedValue(content)
    const { result } = renderHook(() =>
      useSignatureDocumentGroup({
        document: {
          requestDocumentId: 'request-document-id',
          status: 'confirmed',
          signedArtifactAvailable: true,
          signatories: [],
        } as never,
        isResending: false,
        onRequestResend: () => undefined,
        canViewDocuments: true,
        isSignatureRequestConfirmed: true,
        onGetDocumentContent,
      }),
    )

    await act(async () => {
      await result.current.handleOpenDocument('original')
    })

    expect(onGetDocumentContent).toHaveBeenCalledWith('request-document-id', 'original')
    expect(createObjectUrl).toHaveBeenCalledWith(content)
    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectUrl).not.toHaveBeenCalled()
  })
})
