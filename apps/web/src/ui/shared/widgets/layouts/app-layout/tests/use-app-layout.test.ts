import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CollaboratorProfile } from '@hms/core/identity/domain/structures'

import { SIDEBAR_ITEMS } from '@/constants/sidebar-items'
import { useUrlPathname } from '@/ui/shared/hooks/use-url-pathname'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useAppLayout } from '../use-app-layout'

vi.mock('@/ui/shared/hooks/use-url-pathname', () => ({
  useUrlPathname: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-current-collaborator-query', () => ({
  useCurrentCollaboratorQuery: vi.fn(),
}))

vi.mock('@/ui/shared/contexts/auth-context/use-auth-context', () => ({
  useAuthContext: vi.fn(),
}))

const useUrlPathnameMock = vi.mocked(useUrlPathname)
const useCurrentCollaboratorQueryMock = vi.mocked(useCurrentCollaboratorQuery)
const useAuthContextMock = vi.mocked(useAuthContext)

describe('useAppLayout', () => {
  beforeEach(() => {
    useUrlPathnameMock.mockReturnValue('/intakes')
    useAuthContextMock.mockReturnValue({
      user: {
        id: 'attendant-id',
        email: 'attendant@example.com',
        role: CollaboratorProfile.Attendant,
      },
      signOut: vi.fn(),
    } as any)
    useCurrentCollaboratorQueryMock.mockReturnValue({
      currentCollaborator: {
        collaboratorId: 'attendant-id',
        professionalName: 'Atendente',
        email: 'attendant@example.com',
        profile: CollaboratorProfile.Attendant,
        status: 'active',
      },
      currentCollaboratorError: null,
      isLoadingCurrentCollaborator: false,
    })
  })

  it('returns the current pathname and the real collaborator sidebar items', () => {
    const { result } = renderHook(() => useAppLayout())

    expect(result.current.pathname).toBe('/intakes')
    expect(result.current.isSidebarCollapsed).toBe(false)
    expect(result.current.sidebarItems).toEqual(
      SIDEBAR_ITEMS[CollaboratorProfile.Attendant],
    )
    expect(result.current.sidebarItems).not.toContainEqual(
      expect.objectContaining({ label: 'Comunicação' }),
    )
  })

  it('shows the collaborators entry only for an administrator', () => {
    useCurrentCollaboratorQueryMock.mockReturnValue({
      currentCollaborator: {
        collaboratorId: 'admin-id',
        professionalName: 'Administrador',
        email: 'admin@example.com',
        profile: CollaboratorProfile.Admin,
        status: 'active',
      },
      currentCollaboratorError: null,
      isLoadingCurrentCollaborator: false,
    })

    const { result } = renderHook(() => useAppLayout())

    expect(result.current.sidebarItems).toEqual(SIDEBAR_ITEMS[CollaboratorProfile.Admin])
    expect(result.current.sidebarItems).toContainEqual(
      expect.objectContaining({ route: 'collaborators', label: 'Colaboradores' }),
    )
  })

  it('toggles the collapsed sidebar state', () => {
    const { result } = renderHook(() => useAppLayout())

    act(() => {
      result.current.handleSidebarToggle(true)
    })

    expect(result.current.isSidebarCollapsed).toBe(true)

    act(() => {
      result.current.handleSidebarToggle(false)
    })

    expect(result.current.isSidebarCollapsed).toBe(false)
  })
})
