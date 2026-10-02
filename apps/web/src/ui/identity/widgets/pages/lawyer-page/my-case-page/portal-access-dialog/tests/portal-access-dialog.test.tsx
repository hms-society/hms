import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ThirdParty } from '@hms/core/identity/domain/entities'

import { PortalAccessDialog } from '../index'

const thirdParty = {
  id: 'third-party-1',
  legalName: 'Sindicato dos Trabalhadores Exemplo',
  tradeName: 'Sindicato Exemplo',
  status: 'active',
} as ThirdParty

describe('PortalAccessDialog', () => {
  afterEach(cleanup)

  it('requires selecting a third party before generating a link', () => {
    const onGenerate = vi.fn()

    const { rerender } = render(
      <PortalAccessDialog
        expiresAt={null}
        onCopy={vi.fn()}
        onGenerate={onGenerate}
        onOpenChange={vi.fn()}
        open
        selectedThirdPartyId=''
        thirdParties={[thirdParty]}
        url={null}
      />,
    )

    const generateButton = screen.getByRole('button', { name: 'Gerar link' })
    expect(generateButton.hasAttribute('disabled')).toBe(true)

    fireEvent.change(screen.getByLabelText('Terceiro'), {
      target: { value: thirdParty.id },
    })
    rerender(
      <PortalAccessDialog
        canViewCaseStatus
        expiresAt={null}
        onCopy={vi.fn()}
        onGenerate={onGenerate}
        onOpenChange={vi.fn()}
        open
        selectedThirdPartyId={thirdParty.id}
        thirdParties={[thirdParty]}
        url={null}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Gerar link' }))

    expect(onGenerate).toHaveBeenCalledOnce()
  })

  it('notifies the selection and keeps the cancel button pill-shaped', () => {
    const onThirdPartyChange = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <PortalAccessDialog
        expiresAt={null}
        onCopy={vi.fn()}
        onOpenChange={onOpenChange}
        onThirdPartyChange={onThirdPartyChange}
        open
        thirdParties={[thirdParty]}
        url={null}
      />,
    )

    fireEvent.change(screen.getByLabelText('Terceiro'), {
      target: { value: thirdParty.id },
    })
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar' })[0])

    expect(onThirdPartyChange).toHaveBeenCalledWith(thirdParty.id)
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getAllByRole('button', { name: 'Cancelar' })[0].className).toContain(
      'rounded-full',
    )
  })

  it('shows the persistent-access message after generating the link', () => {
    render(
      <PortalAccessDialog
        expiresAt={null}
        onCopy={vi.fn()}
        onOpenChange={vi.fn()}
        open
        url='http://localhost:3000/third-party-portal/cases/case-1?portalToken=token'
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Link para terceiro gerado' }),
    ).toBeTruthy()
    expect(
      screen.getByText(/permanece válido enquanto o acesso estiver ativo/i),
    ).toBeTruthy()
    expect(screen.getByDisplayValue(/third-party-portal/)).toBeTruthy()
  })

  it('restores the previously selected third party permissions', () => {
    render(
      <PortalAccessDialog
        canViewCaseStatus={false}
        canViewIntakeStatus
        canUpload={false}
        expiresAt={null}
        onCopy={vi.fn()}
        onOpenChange={vi.fn()}
        open
        selectedThirdPartyId={thirdParty.id}
        thirdParties={[thirdParty]}
        url={null}
      />,
    )

    expect(
      (
        screen.getByRole('checkbox', {
          name: 'Visualizar status do caso',
        }) as HTMLInputElement
      ).checked,
    ).toBe(false)
    expect(
      (
        screen.getByRole('checkbox', {
          name: 'Visualizar status do intake',
        }) as HTMLInputElement
      ).checked,
    ).toBe(true)
    expect(
      (
        screen.getByRole('checkbox', {
          name: 'Permitir envio de documentos',
        }) as HTMLInputElement
      ).checked,
    ).toBe(false)
  })
})
