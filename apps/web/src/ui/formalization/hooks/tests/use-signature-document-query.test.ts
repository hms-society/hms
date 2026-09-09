import { act, renderHook, waitFor } from '@testing-library/react'
import { RestResponse } from '@hms/core/shared/responses/rest-response'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useSignatureDocumentQuery } from '../use-signature-document-query'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))

const getDocumentContent = vi.fn()

describe('useSignatureDocumentQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRestContext).mockReturnValue({
      signingGatewayService: { getDocumentContent },
    } as never)
  })

  it('loads the selected private document', async () => {
    const content = new ArrayBuffer(4)
    getDocumentContent.mockResolvedValue(new RestResponse({ body: content }))
    const { result } = renderHook(() => useSignatureDocumentQuery('document-1', true))
    await waitFor(() => expect(result.current.content).toBe(content))
    expect(getDocumentContent).toHaveBeenCalledWith('document-1')
  })

  it('does not load while disabled', () => {
    renderHook(() => useSignatureDocumentQuery('document-1', false))
    expect(getDocumentContent).not.toHaveBeenCalled()
  })

  it('clears content while switching tabs', async () => {
    getDocumentContent.mockResolvedValueOnce(
      new RestResponse({ body: new ArrayBuffer(1) }),
    )
    let resolveSecond: ((value: RestResponse<ArrayBuffer>) => void) | undefined
    getDocumentContent.mockImplementationOnce(
      () => new Promise((resolve) => (resolveSecond = resolve)),
    )
    const { result, rerender } = renderHook(
      ({ id }) => useSignatureDocumentQuery(id, true),
      { initialProps: { id: 'document-1' } },
    )
    await waitFor(() => expect(result.current.content).not.toBeNull())
    rerender({ id: 'document-2' })
    expect(result.current.content).toBeNull()
    await act(async () => {
      resolveSecond?.(new RestResponse({ body: new ArrayBuffer(2) }))
    })
    await waitFor(() => expect(result.current.content?.byteLength).toBe(2))
  })

  it('exposes a safe REST failure without retaining content', async () => {
    getDocumentContent.mockResolvedValue(
      new RestResponse({ statusCode: 404, errorMessage: 'Documento indisponível.' }),
    )
    const { result } = renderHook(() => useSignatureDocumentQuery('document-1', true))
    await waitFor(() => expect(result.current.error).toBe('Documento indisponível.'))
    expect(result.current.content).toBeNull()
  })
})
