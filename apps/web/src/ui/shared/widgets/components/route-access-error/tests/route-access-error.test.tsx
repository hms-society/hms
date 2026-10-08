import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ invalidate: vi.fn() }))

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate: mocks.invalidate }),
}))

import { RouteAccessError } from '../index'

describe('RouteAccessError', () => {
  beforeEach(() => vi.clearAllMocks())

  it('explains the access failure and retries the current route', () => {
    render(<RouteAccessError />)

    expect(
      screen.getByRole('heading', { name: 'Não foi possível verificar seu acesso' }),
    ).toBeTruthy()
    expect(
      screen.getByText('Nenhum conteúdo protegido foi carregado. Tente novamente.'),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(mocks.invalidate).toHaveBeenCalledOnce()
  })
})
