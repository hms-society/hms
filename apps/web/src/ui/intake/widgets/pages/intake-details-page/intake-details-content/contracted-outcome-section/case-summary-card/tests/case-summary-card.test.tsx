import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CaseSummaryCard } from '..'

const legalCase = {
  caseId: 'case-1',
  intakeId: 'intake-1',
  publicCode: 'CAS-0001',
  status: 'documentation',
  legalAreaId: 'area-1',
  openedAt: new Date('2026-08-26T12:00:00.000Z'),
} as never

describe('CaseSummaryCard', () => {
  afterEach(cleanup)

  it('renders public Case facts and leaves navigation disabled by contract', () => {
    render(
      <CaseSummaryCard
        legalCase={legalCase}
        legalAreaName='Cível'
        primaryLawyerName='Ana Advogada'
        isUnavailable={false}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText('Caso')).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'CAS-0001' })).not.toBeNull()
    expect(screen.getByText('Documentação')).not.toBeNull()
    expect(screen.getByText('Cível')).not.toBeNull()
    expect(screen.getByText('Ana Advogada')).not.toBeNull()
    expect(
      (screen.getByRole('button', { name: /Abrir caso/ }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it('renders absent and unavailable states with a local retry only', () => {
    const onRetry = vi.fn()
    const { rerender } = render(
      <CaseSummaryCard isUnavailable={false} onRetry={onRetry} />,
    )
    expect(
      screen.getByRole('heading', { name: 'Nenhum caso relacionado' }),
    ).not.toBeNull()
    expect(screen.getByText('Nenhum caso foi iniciado para este Intake.')).not.toBeNull()
    expect(
      screen.getByText(
        'A visualização detalhada de casos estará disponível em uma próxima etapa.',
      ),
    ).not.toBeNull()

    rerender(<CaseSummaryCard isUnavailable onRetry={onRetry} />)
    expect(screen.getByRole('alert').textContent).toContain('Não foi possível carregar')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
