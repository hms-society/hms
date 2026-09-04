import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useAcknowledgeSignatureDocumentAction } from '../use-acknowledge-signature-document-action'
import { useStartSigningAction } from '../use-start-signing-action'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))

const acknowledgeDocument = vi.fn()
const startSigning = vi.fn()

describe('signing package actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRestContext).mockReturnValue({
      signingGatewayService: { acknowledgeDocument, startSigning },
    } as never)
  })

  it('sends a literal per-document acknowledgement', async () => {
    acknowledgeDocument.mockResolvedValue({ isFailure: false })
    const { result } = renderHook(() => useAcknowledgeSignatureDocumentAction())
    await act(() =>
      result.current.execute({
        requestDocumentId: 'document-1',
        expectedRequestVersion: 7,
      }),
    )
    expect(acknowledgeDocument).toHaveBeenCalledWith('document-1', {
      expectedRequestVersion: 7,
      acknowledged: true,
    })
  })

  it('clears acknowledgement pending state after a network failure', async () => {
    acknowledgeDocument.mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useAcknowledgeSignatureDocumentAction())
    await expect(
      act(() =>
        result.current.execute({
          requestDocumentId: 'document-1',
          expectedRequestVersion: 7,
        }),
      ),
    ).rejects.toThrow('network')
    expect(result.current.isPending).toBe(false)
  })

  it('starts the package without a legacy acknowledgement flag', async () => {
    startSigning.mockResolvedValue({ isFailure: false })
    const { result } = renderHook(() => useStartSigningAction())
    await act(() => result.current.execute(9))
    expect(startSigning).toHaveBeenCalledWith({ expectedRequestVersion: 9 })
  })

  it('clears start pending state after a network failure', async () => {
    startSigning.mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useStartSigningAction())
    await expect(act(() => result.current.execute(9))).rejects.toThrow('network')
    expect(result.current.isPending).toBe(false)
  })
})
