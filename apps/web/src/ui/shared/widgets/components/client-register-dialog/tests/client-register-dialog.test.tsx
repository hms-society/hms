import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { ClientRegisterDialog } from '../index'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

const clientDetails = {
  client: {
    id: 'client-id',
    type: 'natural' as const,
    name: 'Maria Aparecida',
    taxId: { type: 'cpf' as const, value: '52998224725' },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  consents: [],
}

describe('ClientRegisterDialog', () => {
  const identityService = {
    lookupClient: vi.fn(),
    registerClient: vi.fn(),
    getClient: vi.fn(),
    grantClientConsent: vi.fn(),
  }
  const onOpenChange = vi.fn()
  const onClientSelected = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useRestContextMock.mockReturnValue({ identityService, intakeService: {} } as never)
  })

  afterEach(cleanup)

  it('renders Identification with accessible semantics and blocks invalid lookup requests', async () => {
    render(
      <ClientRegisterDialog
        open
        onOpenChange={onOpenChange}
        onClientSelected={onClientSelected}
      />,
    )

    expect(
      screen.getByRole('dialog', { name: 'Identificar ou cadastrar cliente' }),
    ).toBeTruthy()
    expect(screen.getByLabelText('CPF ou CNPJ')).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Etapas do cadastro' })).toBeTruthy()
    expect(screen.getByText('Etapa 1 de 5')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Fechar diálogo' })).toBeTruthy()
    expect(
      screen
        .getByRole('navigation', { name: 'Etapas do cadastro' })
        .querySelector('[aria-current="step"]')?.textContent,
    ).toContain('Identificação')

    fireEvent.change(screen.getByLabelText('CPF ou CNPJ'), {
      target: { value: '111.111.111-11' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar cliente' }))

    expect((await screen.findByRole('alert')).textContent).toContain('válido')
    expect(identityService.lookupClient).not.toHaveBeenCalled()
  })

  it('shows an existing client and delegates selection to the consumer', async () => {
    identityService.lookupClient.mockResolvedValue(
      new RestResponse({ body: clientDetails }),
    )
    const outerSubmit = vi.fn()
    render(
      <form onSubmit={outerSubmit}>
        <ClientRegisterDialog
          open
          onOpenChange={onOpenChange}
          onClientSelected={onClientSelected}
        />
      </form>,
    )

    fireEvent.change(screen.getByLabelText('CPF ou CNPJ'), {
      target: { value: '529.982.247-25' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar cliente' }))

    expect(await screen.findByText('Cliente já cadastrado')).toBeTruthy()
    expect(screen.getByText('Maria Aparecida')).toBeTruthy()
    expect(outerSubmit).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir cadastro' }))

    expect(onClientSelected).toHaveBeenCalledWith(clientDetails)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows the not-found state and preserves masked criteria before registration', async () => {
    identityService.lookupClient.mockResolvedValue(
      new RestResponse({ statusCode: 404, errorMessage: 'not found' }),
    )
    render(
      <ClientRegisterDialog
        open
        onOpenChange={onOpenChange}
        onClientSelected={onClientSelected}
      />,
    )

    fireEvent.change(screen.getByLabelText('CPF ou CNPJ'), {
      target: { value: '529.982.247-25' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar cliente' }))
    expect(await screen.findByText('Cliente não encontrado')).toBeTruthy()
    expect(screen.getByText('529.982.247-25')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Continuar cadastro' }))
    await waitFor(() => expect(screen.getByText('Dados do cliente')).toBeTruthy())
    expect(screen.getByDisplayValue('529.982.247-25')).toBeTruthy()
  })

  it('validates WhatsApp on blur and enables only the matching communication consent', async () => {
    identityService.lookupClient.mockResolvedValue(
      new RestResponse({ statusCode: 404, errorMessage: 'not found' }),
    )
    render(
      <ClientRegisterDialog
        open
        onOpenChange={onOpenChange}
        onClientSelected={onClientSelected}
      />,
    )

    fireEvent.change(screen.getByLabelText('CPF ou CNPJ'), {
      target: { value: '529.982.247-25' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar cliente' }))
    expect(await screen.findByText('Cliente não encontrado')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Continuar cadastro' }))
    await waitFor(() => expect(screen.getByText('Dados do cliente')).toBeTruthy())

    const whatsapp = screen.getByLabelText('WhatsApp')
    fireEvent.change(whatsapp, { target: { value: '55' } })
    expect(screen.queryByText(/Informe um WhatsApp válido/)).toBeNull()
    fireEvent.blur(whatsapp)
    expect(await screen.findByText(/Informe um WhatsApp válido/)).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Maria Aparecida' },
    })
    fireEvent.change(whatsapp, { target: { value: '+55 (11) 99999-9999' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() =>
      expect(screen.getByText('Privacidade e consentimentos')).toBeTruthy(),
    )
    expect(
      (
        screen.getByRole('checkbox', {
          name: 'Comunicação por WhatsApp',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false)
    expect(
      (
        screen.getByRole('checkbox', {
          name: 'Comunicação por e-mail',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
  })
})
