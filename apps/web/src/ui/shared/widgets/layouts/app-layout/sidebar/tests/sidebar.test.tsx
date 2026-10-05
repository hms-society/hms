import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CollaboratorProfile } from '@hms/core/identity/domain/structures'

import { ROUTES } from '@/constants/routes'
import { SIDEBAR_ITEMS } from '@/constants/sidebar-items'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import { Sidebar } from '../index'
import type { SidebarProps } from '../index'
import { useSidebar } from '../use-sidebar'

const { handleToggleMock, handleSignOutMock, isItemActiveMock } = vi.hoisted(() => ({
  handleToggleMock: vi.fn(),
  handleSignOutMock: vi.fn(),
  isItemActiveMock: vi.fn(),
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('../use-sidebar', () => ({
  useSidebar: vi.fn(),
}))

const useSidebarMock = vi.mocked(useSidebar)

describe('Sidebar', () => {
  afterEach(cleanup)

  beforeEach(() => {
    handleToggleMock.mockReset()
    handleSignOutMock.mockReset()
    isItemActiveMock.mockReset()
    isItemActiveMock.mockImplementation((route) => route === 'appointmentsCalendar')
    useSidebarMock.mockReturnValue({
      hasUnread: false,
      isPending: false,
      handleToggle: handleToggleMock,
      handleSignOut: handleSignOutMock,
      isItemActive: isItemActiveMock,
    })
  })

  it('renders one current route item using the hook state', () => {
    render(
      <Sidebar
        isCollapsed={false}
        onToggle={vi.fn()}
        activePath={ROUTES.appointmentsCalendar}
        sidebarItems={SIDEBAR_ITEMS[CollaboratorProfile.Lawyer]}
      />,
    )

    const appointmentsLink = screen.getByRole('link', { name: 'Agenda de consultas' })
    const personalScheduleLink = screen.getByRole('link', { name: 'Minha Agenda' })

    expect(appointmentsLink.getAttribute('aria-current')).toBe('page')
    expect(personalScheduleLink.getAttribute('aria-current')).toBeNull()
    expect(
      screen.getAllByRole('link').filter((link) => link.hasAttribute('aria-current')),
    ).toHaveLength(1)
  })

  it('delegates collapse and expand actions to the hook', () => {
    const props: SidebarProps = {
      isCollapsed: false,
      onToggle: vi.fn(),
      activePath: ROUTES.home,
      sidebarItems: SIDEBAR_ITEMS[CollaboratorProfile.Lawyer],
    }

    const { rerender } = render(<Sidebar {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Retrair menu lateral' }))

    expect(handleToggleMock).toHaveBeenCalledTimes(1)

    rerender(<Sidebar {...props} isCollapsed />)
    fireEvent.click(screen.getByRole('button', { name: 'Expandir menu lateral' }))

    expect(handleToggleMock).toHaveBeenCalledTimes(2)
  })

  it('delegates sign out when the action is available', () => {
    render(
      <Sidebar
        isCollapsed={false}
        onToggle={vi.fn()}
        activePath={ROUTES.home}
        sidebarItems={SIDEBAR_ITEMS[CollaboratorProfile.Lawyer]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))

    expect(handleSignOutMock).toHaveBeenCalledTimes(1)
  })

  it('disables sign out while the action is pending', () => {
    useSidebarMock.mockReturnValue({
      hasUnread: false,
      isPending: true,
      handleToggle: handleToggleMock,
      handleSignOut: handleSignOutMock,
      isItemActive: isItemActiveMock,
    })

    render(
      <Sidebar
        isCollapsed={false}
        onToggle={vi.fn()}
        activePath={ROUTES.home}
        sidebarItems={SIDEBAR_ITEMS[CollaboratorProfile.Lawyer]}
      />,
    )

    expect(
      (screen.getByRole('button', { name: 'Sair' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })
})
