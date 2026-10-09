import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCollaboratorProfessionalProfileQuery } from '@/ui/identity/hooks/use-collaborator-professional-profile-query'

import { useCollaboratorProfessionalProfilePage } from '../use-collaborator-professional-profile-page'

vi.mock('@/ui/identity/hooks/use-collaborator-professional-profile-query', () => ({
  useCollaboratorProfessionalProfileQuery: vi.fn(),
}))

const useCollaboratorProfessionalProfileQueryMock = vi.mocked(
  useCollaboratorProfessionalProfileQuery,
)

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useCollaboratorProfessionalProfilePage', () => {
  it('exposes profile query state and resolves known and unknown profile labels', () => {
    const clearProfessionalProfile = vi.fn()
    const refetchProfessionalProfile = vi.fn()
    const professionalProfile = {
      collaboratorId: 'collaborator-1',
      professionalName: 'Maria Oliveira',
      email: 'maria@example.test',
      profile: 'lawyer' as const,
      legalExpertises: [],
    }
    const professionalProfileError = new Error('query failed')
    useCollaboratorProfessionalProfileQueryMock.mockReturnValue({
      clearProfessionalProfile,
      isLoadingProfessionalProfile: true,
      professionalProfile,
      professionalProfileError,
      refetchProfessionalProfile,
    } as unknown as ReturnType<typeof useCollaboratorProfessionalProfileQuery>)

    const { result } = renderHook(() =>
      useCollaboratorProfessionalProfilePage('collaborator-1'),
    )

    expect(result.current.professionalProfile).toBe(professionalProfile)
    expect(result.current.professionalProfileError).toBe(professionalProfileError)
    expect(result.current.isLoadingProfessionalProfile).toBe(true)
    expect(result.current.clearProfessionalProfile).toBe(clearProfessionalProfile)
    expect(result.current.refetchProfessionalProfile).toBe(refetchProfessionalProfile)
    expect(result.current.getProfileLabel('lawyer')).toBe('Advogado')
    expect(result.current.getProfileLabel('future-profile')).toBe('future-profile')
    expect(useCollaboratorProfessionalProfileQueryMock).toHaveBeenCalledWith(
      'collaborator-1',
    )
  })
})
