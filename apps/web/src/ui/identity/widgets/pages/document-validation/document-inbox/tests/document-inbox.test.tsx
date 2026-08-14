import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DocumentInboxPage } from '..'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

describe('DocumentInboxPage', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders inbox documents without invalid source icons crashing the route', () => {
    render(<DocumentInboxPage />)

    expect(screen.getByRole('heading', { name: 'Caixa de documentos' })).toBeDefined()
    expect(screen.getByText('comprovante-residencia.pdf')).toBeDefined()
    expect(screen.getByText('João Paulo Mendes')).toBeDefined()
  })
})
