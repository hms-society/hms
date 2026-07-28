import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

import { useSignInPage } from '../use-sign-in-page'
import { SignInPage } from '../index'

vi.mock('../use-sign-in-page', () => ({
  useSignInPage: vi.fn(),
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, ...props }: AnchorProps) => (
    <a href={route} {...props}>
      {children}
    </a>
  ),
}))

const useSignInPageMock = vi.mocked(useSignInPage)

describe('Sign In Page', () => {
  const handleSubmit = vi.fn()
  const handleTogglePasswordVisibility = vi.fn()
  const register = vi.fn((name: 'email' | 'password') => ({
    name,
    onBlur: vi.fn(),
    onChange: vi.fn(),
    ref: vi.fn(),
  })) as unknown as ReturnType<typeof useSignInPage>['register']

  beforeEach(() => {
    vi.clearAllMocks()
    useSignInPageMock.mockReturnValue({
      error: null,
      handleSubmit,
      handleTogglePasswordVisibility,
      isLoading: false,
      register,
      showPassword: false,
    })
  })

  afterEach(cleanup)

  it('renders the authentication fields and reset-password link', () => {
    render(<SignInPage />)

    expect(screen.getByRole('heading', { name: 'Que bom ter você aqui.' })).toBeTruthy()
    expect(screen.getByLabelText('Email:')).toBeTruthy()
    expect(screen.getByLabelText('Senha')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Esqueci minha senha' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Acessar com Google' })).toBeTruthy()
    expect(screen.queryByText('Primeiro acesso?')).toBeNull()
  })

  it('shows the authentication error and delegates page interactions', () => {
    const error = new Error('Email ou senha inválidos.')
    useSignInPageMock.mockReturnValue({
      error,
      handleSubmit,
      handleTogglePasswordVisibility,
      isLoading: false,
      register,
      showPassword: false,
    })

    render(<SignInPage />)

    expect(screen.getByText(error.message)).toBeTruthy()

    const form = screen
      .getByRole('button', { name: 'Entrar na plataforma' })
      .closest('form')

    expect(form).not.toBeNull()
    fireEvent.submit(form as HTMLFormElement)
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))

    expect(handleSubmit).toHaveBeenCalled()
    expect(handleTogglePasswordVisibility).toHaveBeenCalled()
  })
})
