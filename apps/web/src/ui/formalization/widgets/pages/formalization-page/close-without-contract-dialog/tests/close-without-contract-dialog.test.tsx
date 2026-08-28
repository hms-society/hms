import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CloseWithoutContractDialog } from '../index'
import {
  useCloseWithoutContractDialog,
  type CloseWithoutContractDialogProps,
} from '../use-close-without-contract-dialog'

vi.mock('../use-close-without-contract-dialog', () => ({
  useCloseWithoutContractDialog: vi.fn(),
}))

const useCloseWithoutContractDialogMock = vi.mocked(useCloseWithoutContractDialog)
type Controller = ReturnType<typeof useCloseWithoutContractDialog>

function fakeHook(overrides: Partial<Controller> = {}): Controller {
  return {
    closureReasonLabels: {
      out_of_scope: 'Fora do escopo',
      legally_unviable: 'Inviável juridicamente',
      client_withdrew: 'Desistência do cliente',
      unable_to_contact: 'Sem contato',
      no_show: 'Não compareceu',
      referred: 'Encaminhado',
      other: 'Outro',
    },
    handleConfirm: vi.fn(),
    handleReasonChange: vi.fn(),
    hasReasonError: false,
    reasonErrorId: 'formalization-close-without-contract-reason-error',
    ...overrides,
  }
}

function createProps(
  overrides: Partial<CloseWithoutContractDialogProps> = {},
): CloseWithoutContractDialogProps {
  return {
    open: true,
    reason: '',
    notes: '',
    onOpenChange: vi.fn(),
    onReasonChange: vi.fn(),
    onNotesChange: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  }
}

describe('CloseWithoutContractDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    HTMLElement.prototype.scrollIntoView = vi.fn()
    useCloseWithoutContractDialogMock.mockReturnValue(fakeHook())
  })

  afterEach(cleanup)

  it('renders the closure fields and delegates user input to the owning hook and props', () => {
    const props = createProps()
    const handleReasonChange = vi.fn()
    useCloseWithoutContractDialogMock.mockReturnValue(fakeHook({ handleReasonChange }))

    render(<CloseWithoutContractDialog {...props} />)

    expect(
      screen.getByRole('alertdialog', { name: 'Encerrar sem contratação?' }),
    ).not.toBeNull()
    expect(screen.getByLabelText('Motivo do encerramento *')).not.toBeNull()
    expect(screen.getByLabelText(/Observações/)).not.toBeNull()
    expect(screen.getByText(/Esta ação é definitiva/)).not.toBeNull()

    fireEvent.change(screen.getByLabelText(/Observações/), {
      target: { value: 'Cliente desistiu' },
    })
    expect(props.onNotesChange).toHaveBeenCalledWith('Cliente desistiu')

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByRole('option', { name: 'Fora do escopo' }))
    expect(handleReasonChange).toHaveBeenCalledWith('out_of_scope')
  })

  it('delegates confirmation through the hook handler', () => {
    const handleConfirm = vi.fn()
    useCloseWithoutContractDialogMock.mockReturnValue(fakeHook({ handleConfirm }))

    render(<CloseWithoutContractDialog {...createProps({ reason: 'other' })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Encerrar sem contratação' }))

    expect(handleConfirm).toHaveBeenCalledOnce()
  })

  it('renders the pending state and validation error from the hook', () => {
    useCloseWithoutContractDialogMock.mockReturnValue(fakeHook({ hasReasonError: true }))

    render(
      <CloseWithoutContractDialog
        {...createProps({ isPending: true, error: new Error('Falha ao encerrar') })}
      />,
    )

    expect(
      screen.getByText('Selecione um motivo para encerrar a Formalização.'),
    ).not.toBeNull()
    expect(screen.getByText('Falha ao encerrar')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Encerrando…' })).toHaveProperty(
      'disabled',
      true,
    )
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveProperty(
      'disabled',
      true,
    )
  })
})
