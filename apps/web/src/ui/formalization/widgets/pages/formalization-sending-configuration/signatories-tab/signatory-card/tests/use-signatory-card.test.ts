import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useSignatoryCard } from '../use-signatory-card'

const signatory = {
  signatoryId: 'signatory-1',
  personId: 'person-1',
  role: 'client',
  name: 'Cliente',
  removable: true,
  availableChannels: ['email', 'whatsapp'],
  selectedChannels: ['email'],
  documentIds: ['document-1'],
} as const

const documents = [
  {
    documentId: 'document-1',
    documentVersionId: 'version-1',
    name: 'Contrato',
    reviewStatus: 'approved',
    fields: [],
  },
]

function createProps() {
  return {
    signatory,
    documents,
    selectedDocuments: ['document-1'] as readonly string[],
    onSelectedDocumentsChange: vi.fn(),
    onSelectChannel: vi.fn(),
    onRemoveSignatory: vi.fn().mockResolvedValue(undefined),
    isRemovingSignatory: false,
    isReplacingSignatoryDocuments: false,
    isSelectingSignatoryChannel: false,
    isReadOnly: false,
    removeSignatoryError: null,
  }
}

describe('useSignatoryCard', () => {
  it('toggles document assignment and delegates channel selection', () => {
    const props = createProps()
    const { result } = renderHook(() => useSignatoryCard(props))

    act(() => {
      result.current.handleToggleDocument('document-1')
      result.current.onSelectChannel('whatsapp', true)
    })

    expect(props.onSelectedDocumentsChange).toHaveBeenCalledWith([])
    expect(props.onSelectChannel).toHaveBeenCalledWith('whatsapp', true)
  })

  it('does not mutate assignments or open removal while read-only', async () => {
    const props = { ...createProps(), isReadOnly: true }
    const { result } = renderHook(() => useSignatoryCard(props))

    act(() => {
      result.current.handleToggleDocument('document-1')
      result.current.onSelectChannel('whatsapp', true)
      result.current.handleRemoveDialogOpenChange(true)
    })
    await act(async () => {
      await result.current.handleConfirmRemove()
    })

    expect(props.onSelectedDocumentsChange).not.toHaveBeenCalled()
    expect(props.onSelectChannel).not.toHaveBeenCalled()
    expect(props.onRemoveSignatory).not.toHaveBeenCalled()
    expect(result.current.removeDialogOpen).toBe(false)
  })
})
