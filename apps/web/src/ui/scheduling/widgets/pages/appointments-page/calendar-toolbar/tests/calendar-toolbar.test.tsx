import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CalendarToolbar } from '..'

describe('CalendarToolbar', () => {
  it('supports view changes, period navigation and filters without a Today action', () => {
    const onViewChange = vi.fn()
    const onPrevious = vi.fn()
    const onNext = vi.fn()
    const onLawyerFilterOpen = vi.fn()
    render(
      <CalendarToolbar
        view='week'
        date='2026-09-24'
        event='all'
        onViewChange={onViewChange}
        onPrevious={onPrevious}
        onNext={onNext}
        onLawyerFilterOpen={onLawyerFilterOpen}
        onEventChange={() => undefined}
        onClientFilterOpen={() => undefined}
        onClearFilters={() => undefined}
      />,
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Mês' }))
    fireEvent.click(screen.getByRole('button', { name: 'Período anterior' }))
    fireEvent.click(screen.getByRole('button', { name: 'Próximo período' }))
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar por advogado' }))
    expect(onViewChange).toHaveBeenCalledWith('month')
    expect(onPrevious).toHaveBeenCalledOnce()
    expect(onNext).toHaveBeenCalledOnce()
    expect(onLawyerFilterOpen).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Hoje' })).toBeNull()
  })
})
