import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CalendarFeedback } from '..'

describe('CalendarFeedback', () => {
  it('renders loading and retryable error states', () => {
    render(<CalendarFeedback variant='loading' />)
    expect(screen.getByRole('status').textContent).toContain('Carregando agenda')
    const onRetry = vi.fn()
    render(<CalendarFeedback variant='error' onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('distinguishes a filtered empty result and clears filters', () => {
    const onClearFilters = vi.fn()
    render(<CalendarFeedback variant='filtered-empty' onClearFilters={onClearFilters} />)
    expect(screen.getByText('Nenhuma consulta encontrada')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(onClearFilters).toHaveBeenCalledOnce()
  })
})
