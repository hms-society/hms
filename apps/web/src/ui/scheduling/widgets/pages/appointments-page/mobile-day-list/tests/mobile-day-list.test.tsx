import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MobileDayList } from '..'

describe('MobileDayList', () => {
  it('renders a day-grouped mobile agenda without a horizontal grid', () => {
    render(
      <MobileDayList
        view='week'
        date='2026-09-24'
        events={[]}
        onOpenAppointment={() => undefined}
      />,
    )
    expect(screen.getByRole('region', { name: 'Agenda em lista' })).toBeDefined()
    expect(screen.getAllByText('Nenhum compromisso neste dia.').length).toBe(7)
  })
})
