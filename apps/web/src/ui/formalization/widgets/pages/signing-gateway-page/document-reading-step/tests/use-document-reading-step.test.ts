import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSignatureDocumentQuery } from '@/ui/formalization/hooks/use-signature-document-query'
import { useDocumentReadingStep } from '../use-document-reading-step'

vi.mock('@/ui/formalization/hooks/use-signature-document-query', () => ({
  useSignatureDocumentQuery: vi.fn(),
}))

const documents = [
  { id: 'document-1', title: 'Contrato', position: 0 },
  { id: 'document-2', title: 'Procuração', position: 1 },
]
const props = {
  documents,
  acknowledgedDocumentIds: [] as string[],
  activeDocumentId: 'document-1',
  isPending: false,
  onSelectDocument: vi.fn(),
  onAcknowledgeDocument: vi.fn(),
  onContinue: vi.fn(),
}

describe('useDocumentReadingStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSignatureDocumentQuery).mockReturnValue({
      content: new ArrayBuffer(4),
      error: undefined,
      isFetching: false,
      isLoading: false,
      refetch: vi.fn(),
    })
  })

  it('loads content for the active tab only', () => {
    renderHook(() => useDocumentReadingStep(props))
    expect(useSignatureDocumentQuery).toHaveBeenCalledWith('document-1', true)
  })

  it('falls back to the first document for an invalid active id', () => {
    const { result } = renderHook(() =>
      useDocumentReadingStep({ ...props, activeDocumentId: 'missing' }),
    )
    expect(result.current.activeDocument?.id).toBe('document-1')
  })

  it('tracks independent and aggregate acknowledgements', () => {
    const partial = renderHook(() =>
      useDocumentReadingStep({ ...props, acknowledgedDocumentIds: ['document-1'] }),
    )
    expect(partial.result.current.acknowledged).toBe(true)
    expect(partial.result.current.allAcknowledged).toBe(false)

    const complete = renderHook(() =>
      useDocumentReadingStep({
        ...props,
        acknowledgedDocumentIds: ['document-1', 'document-2'],
      }),
    )
    expect(complete.result.current.allAcknowledged).toBe(true)
  })

  it('acknowledges only the active unacknowledged document', () => {
    const { result } = renderHook(() => useDocumentReadingStep(props))
    act(() => result.current.handleAcknowledge())
    expect(props.onAcknowledgeDocument).toHaveBeenCalledWith('document-1')
  })

  it('does not duplicate an existing acknowledgement', () => {
    const { result } = renderHook(() =>
      useDocumentReadingStep({ ...props, acknowledgedDocumentIds: ['document-1'] }),
    )
    act(() => result.current.handleAcknowledge())
    expect(props.onAcknowledgeDocument).not.toHaveBeenCalled()
  })

  it('preserves PDF errors and retry behavior', () => {
    const refetch = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useSignatureDocumentQuery).mockReturnValue({
      content: null,
      error: 'Falha ao carregar',
      isFetching: false,
      isLoading: false,
      refetch,
    })
    const { result } = renderHook(() => useDocumentReadingStep(props))
    void result.current.handleRetry()
    expect(result.current.documentError).toBe('Falha ao carregar')
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('keeps action failures separate from PDF loading failures', () => {
    const { result } = renderHook(() =>
      useDocumentReadingStep({ ...props, actionError: 'Não foi possível confirmar.' }),
    )

    expect(result.current.actionError).toBe('Não foi possível confirmar.')
    expect(result.current.documentError).toBeUndefined()
    expect(result.current.content).not.toBeNull()
  })
})
