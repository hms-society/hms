import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SignatoryCard } from '..'

const props = {
  signatory: {
    signatoryId: 'signatory-1',
    personId: 'person-1',
    role: 'client',
    name: 'Cliente',
    removable: true,
    availableChannels: ['email'],
    selectedChannels: ['email'],
    documentIds: ['document-1'],
  },
  documents: [
    {
      documentId: 'document-1',
      documentVersionId: 'version-1',
      name: 'Contrato',
      reviewStatus: 'approved',
      fields: [],
    },
  ],
  selectedDocuments: ['document-1'],
  onSelectedDocumentsChange: vi.fn(),
  onSelectChannel: vi.fn(),
  onRemoveSignatory: vi.fn().mockResolvedValue(undefined),
  isRemovingSignatory: false,
  isReplacingSignatoryDocuments: false,
  isSelectingSignatoryChannel: false,
  removeSignatoryError: null,
} as const

describe('SignatoryCard', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the signer and document assignment control', () => {
    render(<SignatoryCard {...props} />)

    expect(screen.getByRole('heading', { name: 'Cliente' })).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: 'E-mail' })).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: 'Contrato' })).toBeTruthy()
  })

  it('delegates document changes', () => {
    render(<SignatoryCard {...props} />)

    const documentCheckbox = document.getElementById('signatory-1-document-1')
    if (!documentCheckbox) throw new Error('Expected a document assignment checkbox')
    fireEvent.click(documentCheckbox)

    expect(props.onSelectedDocumentsChange).toHaveBeenCalledWith([])
  })

  it('delegates channel changes from the channel checkbox', () => {
    const channelProps = {
      ...props,
      signatory: {
        ...props.signatory,
        availableChannels: ['email', 'whatsapp'],
      },
    } as const

    render(<SignatoryCard {...channelProps} />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'WhatsApp' }))

    expect(props.onSelectChannel).toHaveBeenCalledWith('whatsapp', true)
  })

  it('renders selected channels independently and delegates deselection', () => {
    const channelProps = {
      ...props,
      signatory: {
        ...props.signatory,
        availableChannels: ['email', 'whatsapp'],
        selectedChannels: ['email', 'whatsapp'],
      },
    } as const

    render(<SignatoryCard {...channelProps} />)

    expect(
      screen.getByRole('checkbox', { name: 'E-mail' }).getAttribute('aria-checked'),
    ).toBe('true')
    expect(
      screen.getByRole('checkbox', { name: 'WhatsApp' }).getAttribute('aria-checked'),
    ).toBe('true')

    fireEvent.click(screen.getByRole('checkbox', { name: 'E-mail' }))

    expect(props.onSelectChannel).toHaveBeenCalledWith('email', false)
  })
})
