import type { ReactNode } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FormalizationCompletionCard } from '..'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({
    children,
    params,
  }: {
    children: ReactNode
    params?: { formalizationId?: string }
  }) => <a href={`/formalizacoes/${params?.formalizationId ?? ''}`}>{children}</a>,
}))

const summary = {
  formalizationId: 'formalization-1',
  intakeId: 'intake-1',
  status: 'completed',
  completedAt: new Date('2026-08-26T12:00:00.000Z'),
  signatureRequestId: 'request-1',
  signatureStatus: 'confirmed',
} as never

describe('FormalizationCompletionCard', () => {
  afterEach(cleanup)

  it('renders completed status and canonical Formalization destination', () => {
    render(
      <FormalizationCompletionCard
        summary={summary}
        isUnavailable={false}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText('Concluída')).not.toBeNull()
    expect(screen.getByText('Contratação confirmada')).not.toBeNull()
    expect(screen.getByText('Concluída em')).not.toBeNull()
    expect(screen.getByText('Todas confirmadas')).not.toBeNull()
    expect(
      screen.getByText('Configuração e histórico disponíveis para consulta.'),
    ).not.toBeNull()
    expect(
      screen.getByRole('link', { name: /Abrir formalização/ }).getAttribute('href'),
    ).toBe('/formalizacoes/formalization-1')
  })

  it('keeps a local retry action when the optional completion projection is unavailable', () => {
    const onRetry = vi.fn()
    render(<FormalizationCompletionCard isUnavailable onRetry={onRetry} />)

    expect(
      screen.getByText('Não foi possível carregar o resumo da formalização.'),
    ).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetry).toHaveBeenCalledOnce()
    expect(screen.queryByRole('link')).toBeNull()
  })
})
