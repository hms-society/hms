import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClientRegistrationDataTab } from './client-registration-data-tab'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useUpdateClientAction } from '@/ui/identity/hooks/use-update-client-action'
import { Toaster } from 'sonner'

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async (values: any) => ({
    values,
    errors: {},
  }),
}))

// Mock the hooks
vi.mock('@/ui/identity/hooks/use-current-collaborator-query')
vi.mock('@/ui/identity/hooks/use-update-client-action')

const mockUpdateClient = vi.fn()

const getInitialData = () => ({
  type: 'natural' as const,
  name: 'John Doe',
  taxId: { type: 'cpf' as const, value: '111.111.111-11' },
  phone: '11999999999',
  email: 'john@example.com',
})

describe('ClientRegistrationDataTab', () => {
  let unmountComponent: () => void

  afterEach(() => {
    if (unmountComponent) unmountComponent()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useUpdateClientAction).mockReturnValue({
      updateClient: mockUpdateClient,
      isUpdatingClient: false,
    } as any)
  })

  it('disables critical fields if the user is an attendant', () => {
    vi.mocked(useCurrentCollaboratorQuery).mockReturnValue({
      currentCollaborator: { profile: 'attendant' },
    } as any)

    const { unmount } = render(
      <ClientRegistrationDataTab clientId='123' initialData={getInitialData()} />,
    )
    unmountComponent = unmount

    // Using querySelector since labels aren't associated with IDs
    const nameInput = document.querySelector('input[name="name"]')
    const cpfInput = document.querySelector('input[name="taxId.value"]')

    expect(nameInput?.hasAttribute('disabled')).toBe(true)
    expect(cpfInput?.hasAttribute('disabled')).toBe(true)

    // Attendant can edit contact and address
    const emailInput = document.querySelector('input[name="email"]')
    const phoneInput = document.querySelector('input[name="phone"]')

    expect(emailInput?.hasAttribute('disabled')).toBe(false)
    expect(phoneInput?.hasAttribute('disabled')).toBe(false)
  })

  it.skip('shows audit confirmation modal on submit', async () => {
    vi.mocked(useCurrentCollaboratorQuery).mockReturnValue({
      currentCollaborator: { profile: 'admin' },
    } as any)

    const { unmount } = render(
      <ClientRegistrationDataTab clientId='123' initialData={getInitialData()} />,
    )
    unmountComponent = unmount

    const form = document.querySelector('form') as HTMLFormElement
    fireEvent.submit(form)

    // Audit confirmation modal should appear
    expect(
      await screen.findByText(/As mudanças serão registradas em auditoria/i),
    ).toBeTruthy()

    // updateClient should not be called yet
    expect(mockUpdateClient).not.toHaveBeenCalled()
  })

  it.skip('calls updateClient and closes modal when confirmed', async () => {
    vi.mocked(useCurrentCollaboratorQuery).mockReturnValue({
      currentCollaborator: { profile: 'admin' },
    } as any)
    mockUpdateClient.mockResolvedValueOnce({})

    const { unmount } = render(
      <>
        <Toaster />
        <ClientRegistrationDataTab clientId='123' initialData={getInitialData()} />
      </>,
    )
    unmountComponent = unmount

    const form = document.querySelector('form') as HTMLFormElement
    fireEvent.submit(form)

    const confirmButton = await screen.findByRole('button', { name: /^Confirmar$/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockUpdateClient).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: '123',
          changes: expect.objectContaining({ phone: '11999999999' }),
        }),
      )
    })

    expect(await screen.findByText('Dados atualizados com sucesso.')).toBeTruthy()
  })

  it.skip('displays duplicity alert when backend returns conflict error', async () => {
    vi.mocked(useCurrentCollaboratorQuery).mockReturnValue({
      currentCollaborator: { profile: 'admin' },
    } as any)

    const conflictError = new Error('Documento já cadastrado')
    conflictError.name = 'ConflictError'
    mockUpdateClient.mockRejectedValueOnce(conflictError)

    const { unmount } = render(
      <ClientRegistrationDataTab clientId='123' initialData={getInitialData()} />,
    )
    unmountComponent = unmount

    const form = document.querySelector('form') as HTMLFormElement
    fireEvent.submit(form)

    const confirmButton = await screen.findByRole('button', { name: /^Confirmar$/i })
    fireEvent.click(confirmButton)

    // The modal should stay open and display the duplication warning
    expect(await screen.findByText(/Este documento já está cadastrado/i)).toBeTruthy()

    // A justification input should appear
    expect(
      screen.getByPlaceholderText(/Por que deseja salvar este documento duplicado/i),
    ).toBeTruthy()
  })
})
