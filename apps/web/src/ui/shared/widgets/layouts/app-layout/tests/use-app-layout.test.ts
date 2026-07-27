import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CollaboratorProfile } from '@hms/core/identity/domain/structures'

import { SIDEBAR_ITEMS } from '@/constants/sidebar-items'
import { useUrlPathname } from '@/ui/shared/hooks/use-url-pathname'
import { useAppLayout } from '../use-app-layout'

vi.mock('@/ui/shared/hooks/use-url-pathname', () => ({
  useUrlPathname: vi.fn(),
}))

const useUrlPathnameMock = vi.mocked(useUrlPathname)

describe('useAppLayout', () => {
  beforeEach(() => {
    useUrlPathnameMock.mockReturnValue('/intakes')
  })

  it('returns the current pathname and fixed Attendant sidebar items', () => {
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
