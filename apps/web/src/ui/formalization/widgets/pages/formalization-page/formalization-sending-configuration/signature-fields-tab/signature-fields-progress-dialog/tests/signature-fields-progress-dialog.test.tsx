import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SignatureFieldsProgressDialog } from '..'
import { useSignatureFieldsProgressDialog } from '../use-signature-fields-progress-dialog'

vi.mock('../use-signature-fields-progress-dialog', () => ({
  useSignatureFieldsProgressDialog: vi.fn(),
}))

const useProgressDialogMock = vi.mocked(useSignatureFieldsProgressDialog)

const props = {
  documentName: 'Contrato de formalização',
  fields: [],
  signatories: [
    { signatoryId: 'signatory-1', name: 'Cliente HMS Teste' },
    { signatoryId: 'signatory-2', name: 'Marina Costa' },
  ],
} as const

describe('SignatureFieldsProgressDialog', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('opens the progress dialog from the subtle document action', () => {
    const handleOpenChange = vi.fn()
    useProgressDialogMock.mockReturnValue({
      handleOpenChange,
      open: false,
      signatoryStatuses: [],
      configuredSignatoriesCount: 0,
    })

    render(<SignatureFieldsProgressDialog {...props} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Ver campos de Contrato de formalização' }),
    )

    expect(handleOpenChange).toHaveBeenCalledWith(true)
  })

  it('renders each collaborator with an explicit field status', () => {
    const handleOpenChange = vi.fn()
    useProgressDialogMock.mockReturnValue({
      handleOpenChange,
      open: true,
      signatoryStatuses: [
        { ...props.signatories[0], isConfigured: true },
        { ...props.signatories[1], isConfigured: false },
      ],
      configuredSignatoriesCount: 1,
    })

    render(<SignatureFieldsProgressDialog {...props} />)

    expect(screen.getByRole('dialog')).not.toBeNull()
    expect(screen.getByText('Cliente HMS Teste')).not.toBeNull()
    expect(screen.getByText('Marina Costa')).not.toBeNull()
    expect(screen.getByText('Configurado')).not.toBeNull()
    expect(screen.getByText('Não configurado')).not.toBeNull()
    expect(screen.getByText('1/2 configurados')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders the empty assignment state', () => {
    useProgressDialogMock.mockReturnValue({
      handleOpenChange: vi.fn(),
      open: true,
      signatoryStatuses: [],
      configuredSignatoriesCount: 0,
    })

    render(
      <SignatureFieldsProgressDialog
        documentName='Termo de honorários'
        fields={[]}
        signatories={[]}
      />,
    )

    expect(screen.getByText('0/0 configurados')).not.toBeNull()
    expect(
      screen.getByText('Nenhum signatário atribuído a este documento.'),
    ).not.toBeNull()
  })
})
