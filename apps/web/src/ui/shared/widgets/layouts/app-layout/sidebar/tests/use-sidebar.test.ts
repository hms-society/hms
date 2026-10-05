import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CollaboratorProfile } from '@hms/core/identity/domain/structures'

import { ROUTES } from '@/constants/routes'
import { SIDEBAR_ITEMS } from '@/constants/sidebar-items'
import { useCommunication } from '@/ui/shared/contexts/communication-context'
import { useSignOutAction } from '@/ui/shared/hooks/use-sign-out-action'
import { useSidebar } from '../use-sidebar'
import type { SidebarProps } from '../index'

const { signOutMock } = vi.hoisted(() => ({ signOutMock: vi.fn() }))

vi.mock('@/ui/shared/contexts/communication-context', () => ({
  useCommunication: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-sign-out-action', () => ({
  useSignOutAction: vi.fn(),
}))

const useCommunicationMock = vi.mocked(useCommunication)
const useSignOutActionMock = vi.mocked(useSignOutAction)

describe('useSidebar', () => {
  beforeEach(() => {
    signOutMock.mockReset()
    useCommunicationMock.mockReturnValue({
      hasUnread: true,
    } as ReturnType<typeof useCommunication>)
    useSignOutActionMock.mockReturnValue({
      mutate: signOutMock,
      isPending: false,
    } as unknown as ReturnType<typeof useSignOutAction>)
  })

  it('selects only the most specific matching route as active', () => {
    const props: SidebarProps = {
      isCollapsed: false,
      onToggle: vi.fn(),
      activePath: ROUTES.appointmentsCalendar,
      sidebarItems: SIDEBAR_ITEMS[CollaboratorProfile.Lawyer],
    }
    const { result } = renderHook(() => useSidebar(props))

    expect(result.current.isItemActive('lawyerSchedule')).toBe(false)
    expect(result.current.isItemActive('appointmentsCalendar')).toBe(true)
  })

  it('keeps a parent item active on its nested route', () => {
    const props: SidebarProps = {
      isCollapsed: false,
      onToggle: vi.fn(),
      activePath: `${ROUTES.intakes}/new`,
      sidebarItems: SIDEBAR_ITEMS[CollaboratorProfile.Lawyer],
    }
    const { result } = renderHook(() => useSidebar(props))

    expect(result.current.isItemActive('intakes')).toBe(true)
  })

  it('normalizes trailing slashes when matching an exact route', () => {
    const props: SidebarProps = {
      isCollapsed: false,
      onToggle: vi.fn(),
      activePath: `${ROUTES.intakes}/`,
      sidebarItems: SIDEBAR_ITEMS[CollaboratorProfile.Lawyer],
    }
    const { result } = renderHook(() => useSidebar(props))

    expect(result.current.isItemActive('intakes')).toBe(true)
  })

  it('does not treat nested home routes as active', () => {
    const props: SidebarProps = {
      isCollapsed: false,
      onToggle: vi.fn(),
      activePath: `${ROUTES.home}/details`,
      sidebarItems: SIDEBAR_ITEMS[CollaboratorProfile.Lawyer],
    }
    const { result } = renderHook(() => useSidebar(props))

    expect(result.current.isItemActive('home')).toBe(false)
  })

  it('reports unread messages and the pending sign-out state', () => {
    useSignOutActionMock.mockReturnValue({
      mutate: signOutMock,
      isPending: true,
    } as unknown as ReturnType<typeof useSignOutAction>)
    const props: SidebarProps = {
      isCollapsed: false,
      onToggle: vi.fn(),
      activePath: ROUTES.home,
      sidebarItems: SIDEBAR_ITEMS[CollaboratorProfile.Lawyer],
    }
    const { result } = renderHook(() => useSidebar(props))

    expect(result.current.hasUnread).toBe(true)
    expect(result.current.isPending).toBe(true)
  })

  it('toggles the collapsed state through the provided callback', () => {
    const onToggle = vi.fn()
    const props: SidebarProps = {
      isCollapsed: false,
      onToggle,
      activePath: ROUTES.home,
      sidebarItems: SIDEBAR_ITEMS[CollaboratorProfile.Lawyer],
    }
    const { result, rerender } = renderHook(
      ({ sidebarProps }) => useSidebar(sidebarProps),
      { initialProps: { sidebarProps: props } },
    )

    act(() => result.current.handleToggle())
    expect(onToggle).toHaveBeenLastCalledWith(true)

    rerender({ sidebarProps: { ...props, isCollapsed: true } })
    act(() => result.current.handleToggle())
    expect(onToggle).toHaveBeenLastCalledWith(false)
  })

  it('delegates sign out to the sign-out action', () => {
    const props: SidebarProps = {
      isCollapsed: false,
      onToggle: vi.fn(),
      activePath: ROUTES.home,
      sidebarItems: SIDEBAR_ITEMS[CollaboratorProfile.Lawyer],
    }
    const { result } = renderHook(() => useSidebar(props))

    act(() => result.current.handleSignOut())

    expect(signOutMock).toHaveBeenCalledTimes(1)
  })
})
