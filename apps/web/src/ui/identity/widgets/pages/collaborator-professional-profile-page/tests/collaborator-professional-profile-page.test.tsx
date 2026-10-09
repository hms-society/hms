import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCollaboratorProfessionalProfilePage } from '../use-collaborator-professional-profile-page'
import { CollaboratorProfessionalProfilePage } from '..'

type CollaboratorProfessionalProfilePageController = ReturnType<
  typeof useCollaboratorProfessionalProfilePage
>

vi.mock('../use-collaborator-professional-profile-page', () => ({
  useCollaboratorProfessionalProfilePage: vi.fn(),
}))

const useCollaboratorProfessionalProfilePageMock = vi.mocked(
  useCollaboratorProfessionalProfilePage,
)

const professionalProfile = {
  collaboratorId: 'collaborator-1',
  professionalName: 'Maria Oliveira',
  email: 'maria@example.test',
  profile: 'lawyer' as const,
  legalExpertises: [],
}

function createController(
  overrides: Partial<CollaboratorProfessionalProfilePageController> = {},
): CollaboratorProfessionalProfilePageController {
  return {
    clearProfessionalProfile: vi.fn(),
    getProfileLabel: (profile) => profile,
    isLoadingProfessionalProfile: false,
    professionalProfile,
    professionalProfileError: null,
    refetchProfessionalProfile: vi.fn(),
    ...overrides,
  }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CollaboratorProfessionalProfilePage', () => {
  it('shows a loading state while the profile is being fetched', () => {
    useCollaboratorProfessionalProfilePageMock.mockReturnValue(
      createController({ isLoadingProfessionalProfile: true }),
    )

    render(<CollaboratorProfessionalProfilePage collaboratorId='collaborator-1' />)

    expect(screen.getByText('Carregando perfil profissional...')).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Maria Oliveira' })).toBeNull()
  })

  it('offers retry when the profile request fails', () => {
    const refetchProfessionalProfile = vi.fn()
    useCollaboratorProfessionalProfilePageMock.mockReturnValue(
      createController({
        professionalProfileError: new Error('request failed'),
        refetchProfessionalProfile,
      }),
    )

    render(<CollaboratorProfessionalProfilePage collaboratorId='collaborator-1' />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(
      screen.getByText('Não foi possível carregar o perfil profissional.'),
    ).toBeDefined()
    expect(refetchProfessionalProfile).toHaveBeenCalledOnce()
  })

  it('shows the empty expertise state when the profile has no legal expertise', () => {
    useCollaboratorProfessionalProfilePageMock.mockReturnValue(createController())

    render(<CollaboratorProfessionalProfilePage collaboratorId='collaborator-1' />)

    expect(screen.getByRole('heading', { name: 'Maria Oliveira' })).toBeDefined()
    expect(screen.getByText('Nenhuma especialidade jurídica cadastrada.')).toBeDefined()
    expect(screen.getByText('maria@example.test')).toBeDefined()
  })

  it('shows the unavailable state when no profile is returned', () => {
    useCollaboratorProfessionalProfilePageMock.mockReturnValue(
      createController({ professionalProfile: null }),
    )

    render(<CollaboratorProfessionalProfilePage collaboratorId='collaborator-1' />)

    expect(
      screen.getByText('Não foi possível carregar o perfil profissional.'),
    ).toBeDefined()
  })
})
