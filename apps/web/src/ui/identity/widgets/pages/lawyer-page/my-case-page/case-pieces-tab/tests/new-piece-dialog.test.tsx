import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NewPieceDialog } from '../new-piece-dialog'

describe('NewPieceDialog', () => {
  afterEach(cleanup)

  it('does not present the unavailable AI generation as completed', () => {
    const onOpenChangeMock = vi.fn()
    const onGeneratedMock = vi.fn()

    render(
      <NewPieceDialog
        open
        onOpenChange={onOpenChangeMock}
        onGenerated={onGeneratedMock}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }))
    expect(screen.getByRole('heading', { name: 'Preparar geração' })).toBeDefined()
    expect(screen.getByText(/geração e o salvamento da peça dependem/i)).toBeDefined()
    expect(
      (
        screen.getByRole('button', {
          name: 'Geração com IA indisponível',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)

    expect(onOpenChangeMock).not.toHaveBeenCalled()
    expect(onGeneratedMock).not.toHaveBeenCalled()
  })

  it('filters the model options by the search text', () => {
    render(<NewPieceDialog open onOpenChange={vi.fn()} onGenerated={vi.fn()} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar modelo por nome' }), {
      target: { value: 'Modelo Universal' },
    })

    expect(
      screen.getByRole('button', {
        name: /Requerimento Administrativo de Aposentadoria — Modelo Universal/,
      }),
    ).toBeTruthy()
    expect(screen.queryByText('Recurso Administrativo INSS')).toBeNull()
  })

  it('clears the filter when returning to model selection and closes on cancel', () => {
    const onOpenChangeMock = vi.fn()
    render(<NewPieceDialog open onOpenChange={onOpenChangeMock} onGenerated={vi.fn()} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar modelo por nome' }), {
      target: { value: 'Modelo Universal' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Trocar' }))

    expect(
      (
        screen.getByRole('textbox', {
          name: 'Buscar modelo por nome',
        }) as HTMLInputElement
      ).value,
    ).toBe('')
    expect(screen.getByText('Recurso Administrativo INSS')).toBeDefined()

    fireEvent.click(
      within(screen.getByRole('dialog')).getAllByRole('button', { name: 'Cancelar' })[0],
    )
    expect(onOpenChangeMock).toHaveBeenCalledWith(false)
  })

  it('shows the Figma preparation icons and allows manual document selection', () => {
    render(<NewPieceDialog open onOpenChange={vi.fn()} onGenerated={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }))

    const aiActionsHeading = screen.getByRole('heading', { name: 'O que a IA vai fazer' })
    expect(
      aiActionsHeading.parentElement?.querySelector('svg.lucide-sparkles'),
    ).not.toBeNull()
    expect(aiActionsHeading.parentElement?.querySelectorAll('ul > li svg')).toHaveLength(
      4,
    )
    expect(screen.getAllByRole('checkbox')).toHaveLength(4)
    expect(
      screen
        .getByRole('heading', { name: /Documentos de referência do dossiê/ })
        .closest('div')
        ?.querySelector('svg'),
    ).not.toBeNull()
    expect(screen.getByText('0 de 4 selecionados')).toBeDefined()

    const selectedCnis = screen.getByRole('checkbox', {
      name: 'Selecionar CNIS — Cadastro Nacional de Informações Sociais',
    })
    const unselectedRg = screen.getByRole('checkbox', {
      name: 'Selecionar RG — Documento de Identidade',
    })
    expect(selectedCnis.getAttribute('aria-checked')).toBe('false')
    expect(unselectedRg.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(unselectedRg)
    expect(screen.getByText('1 de 4 selecionados')).toBeDefined()
    expect(unselectedRg.getAttribute('aria-checked')).toBe('true')
  })
})
