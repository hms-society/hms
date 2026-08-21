import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CasePendencyBadge } from '../index'

describe('CasePendencyBadge', () => {
  it('renders the pending documents state', () => {
    render(<CasePendencyBadge hasPendency />)

    expect(screen.getByText('Envio de Docs Pendente')).toBeTruthy()
  })

  it('renders the clear state when there are no pending documents', () => {
    render(<CasePendencyBadge hasPendency={false} />)

    expect(screen.getByText('Sem Pendências')).toBeTruthy()
  })
})
