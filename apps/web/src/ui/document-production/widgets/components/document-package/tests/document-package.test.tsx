import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DocumentPackage } from '..'

const item = {
  id: 'document-1',
  title: 'Procuração',
  latestVersion: { id: 'version-1', versionNumber: 1, status: 'approved' as const },
  status: 'approved' as const,
  statusLabel: 'Aprovado',
  isCurrent: true,
  isGenerating: false,
  isTimedOut: false,
}

describe('DocumentPackage', () => {
  afterEach(cleanup)

  it('renders individual actions and omits batch and download controls', () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)

    render(
      <DocumentPackage
        title='Documentos da formalização'
        description='Acompanhe a produção documental.'
        summary='1 documento selecionado'
        items={[item]}
        isConfirmationEligible
        onConfirm={onConfirm}
        renderAction={() => <button type='button'>Visualizar</button>}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Documentos da formalização' }),
    ).toBeDefined()
    expect(screen.getByRole('button', { name: 'Visualizar' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Confirmar pacote' })).toBeDefined()
    expect(screen.queryByRole('button', { name: /gerar documentos/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /baixar/i })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pacote' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('disables confirmation until the adapter reports eligibility', () => {
    render(
      <DocumentPackage
        title='Documentos'
        description='Descrição'
        summary='0 documentos'
        items={[]}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Confirmar pacote' })).toHaveProperty(
      'disabled',
      true,
    )
  })
})
