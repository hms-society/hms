import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CaseActionType } from '../index'

describe('CaseActionType', () => {
  it('renders the civil action label when no legal area is provided', () => {
    render(<CaseActionType />)

    expect(screen.getByText('Petição Inicial / Cível')).toBeTruthy()
  })

  it('maps legal area identifiers to their action labels', () => {
    const { rerender } = render(<CaseActionType areaId='direito-civel' />)

    expect(screen.getByText('Ação Ordinária')).toBeTruthy()

    rerender(<CaseActionType areaId='direito-do-trabalho' />)
    expect(screen.getByText('Reclamação Trabalhista')).toBeTruthy()

    rerender(<CaseActionType areaId='direito-de-familia' />)
    expect(screen.getByText('Ação de Divórcio')).toBeTruthy()
  })
})
