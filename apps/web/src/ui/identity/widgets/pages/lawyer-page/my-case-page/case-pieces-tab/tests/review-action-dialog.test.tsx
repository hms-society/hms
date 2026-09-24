import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ReviewActionDialog } from '../piece-workflow-dialog'

describe('ReviewActionDialog', () => {
  afterEach(cleanup)

  it('shows the full consequences and human confirmation for blocking a piece', () => {
    render(
      <ReviewActionDialog
        kind='block'
        open
        onOpenChange={vi.fn()}
        documentTitle='Petição inicial previdenciária'
        versionNumber={4}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Bloquear por falta documental?' }),
    ).toBeTruthy()
    expect(screen.getByText('PEÇA AFETADA')).toBeTruthy()
    expect(screen.getByText('Petição inicial previdenciária · Versão v4')).toBeTruthy()
    expect(screen.getByText('Esta ação terá os seguintes efeitos')).toBeTruthy()
    expect(screen.getByText(/Peça.*Bloqueada por dossiê incompleto/)).toBeTruthy()
    expect(screen.getByText(/Caso.*retorna à fase de checklist documental/)).toBeTruthy()
    expect(screen.getByText(/Decisão.*registrada no Log de Auditoria/)).toBeTruthy()
    expect(
      screen.getByRole('dialog').querySelector('svg.lucide-octagon-alert'),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'A IA não pode bloquear a peça nem alterar seu status sem esta confirmação humana.',
      ),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Confirmar bloqueio' })).toBeTruthy()
  })

  it('requires human confirmation before approving the identified case piece', () => {
    render(
      <ReviewActionDialog
        kind='approval'
        open
        onOpenChange={vi.fn()}
        documentTitle='Petição inicial previdenciária'
        casePublicCode='CASO-20260923-0002'
        versionNumber={4}
      />,
    )

    expect(screen.getByText('PEÇA EM REVISÃO')).toBeTruthy()
    expect(screen.getByText('CASO-20260923-0002 · Versão v4')).toBeTruthy()
    expect(
      screen.getByRole('dialog').querySelector('svg.lucide-badge-check'),
    ).toBeTruthy()
    expect(
      (screen.getByRole('button', { name: 'Aprovar peça' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(
      screen.getByText(/O clique humano será registrado no Log de Auditoria/),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('checkbox'))

    expect(
      (screen.getByRole('button', { name: 'Aprovar peça' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
  })

  it('shows an adjustment return status and enforces the required comment limit', () => {
    const onConfirmMock = vi.fn()

    render(
      <ReviewActionDialog
        kind='adjustments'
        open
        onOpenChange={vi.fn()}
        documentTitle='Petição inicial previdenciária'
        onConfirm={onConfirmMock}
      />,
    )

    expect(screen.getByText(/A peça retornará para/)).toBeTruthy()
    expect(screen.getByText('Comentários para ajuste')).toBeTruthy()
    expect(screen.getByText('0/1000')).toBeTruthy()
    expect(
      screen.getByRole('dialog').querySelector('svg.lucide-message-square-text'),
    ).toBeTruthy()
    expect(
      (screen.getByRole('button', { name: 'Enviar solicitação' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)

    fireEvent.change(screen.getByRole('textbox', { name: 'Comentários para ajuste' }), {
      target: { value: 'Rever a fundamentação.' },
    })

    expect(screen.getByText('22/1000')).toBeTruthy()
    expect(
      (screen.getByRole('button', { name: 'Enviar solicitação' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
    expect(onConfirmMock).not.toHaveBeenCalled()
  })
})
