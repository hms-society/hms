import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CollaboratorProfile } from '@hms/core/identity/domain/structures'

import { ROUTES } from '@/constants/routes'
import { SIDEBAR_ITEMS } from '@/constants/sidebar-items'
import { AppLayout } from '../index'
import { useAppLayout } from '../use-app-layout'
import type { AnchorProps } from '../../../components/anchor'

const { anchorOnClickMock } = vi.hoisted(() => ({
  anchorOnClickMock: vi.fn(),
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, ...props }: AnchorProps) => (
    <a
      {...props}
      href={ROUTES[route]}
      onClick={(event) => {
        event.preventDefault()
        anchorOnClickMock(ROUTES[route])
      }}
    >
      {children}
    </a>
  ),
}))

vi.mock('../use-app-layout', () => ({
  useAppLayout: vi.fn(),
}))

const useAppLayoutMock = vi.mocked(useAppLayout)

describe('AppLayout', () => {
  const handleSidebarToggle = vi.fn()

  afterEach(cleanup)

  beforeEach(() => {
    handleSidebarToggle.mockReset()
    anchorOnClickMock.mockReset()
    useAppLayoutMock.mockReturnValue({
      pathname: ROUTES.intakes,
      isSidebarCollapsed: false,
      sidebarItems: SIDEBAR_ITEMS[CollaboratorProfile.Attendant],
      handleSidebarToggle,
    })
  })

  it('renders the page content and navigation chrome', () => {
    render(
      <AppLayout>
        <p>Test content</p>
      </AppLayout>,
    )

    expect(screen.getByText('Test content')).toBeTruthy()
    expect(screen.getByLabelText('Navegação principal')).toBeTruthy()
    expect(screen.getByPlaceholderText('Pesquisar Protocolo, documento...')).toBeTruthy()
  })

  it('calls the sidebar toggle handler when collapse is requested', () => {
    render(<AppLayout />)

    fireEvent.click(screen.getByRole('button', { name: 'Retrair menu lateral' }))

    expect(handleSidebarToggle).toHaveBeenCalledWith(true)
  })

  it('delegates navigation when a sidebar item is clicked', () => {
    render(<AppLayout />)

    fireEvent.click(screen.getByRole('link', { name: 'Intakes' }))

    expect(anchorOnClickMock).toHaveBeenCalledWith(ROUTES.intakes)
  })

  it('marks a nested route item as active', () => {
    useAppLayoutMock.mockReturnValue({
      pathname: `${ROUTES.intakes}/new`,
      isSidebarCollapsed: false,
      sidebarItems: SIDEBAR_ITEMS[CollaboratorProfile.Attendant],
      handleSidebarToggle,
    })

    render(<AppLayout />)

    expect(
      screen.getByRole('link', { name: 'Intakes' }).getAttribute('aria-current'),
    ).toBe('page')
  })

  it('normalizes trailing slashes when matching the active route', () => {
    useAppLayoutMock.mockReturnValue({
      pathname: `${ROUTES.intakes}/`,
      isSidebarCollapsed: false,
      sidebarItems: SIDEBAR_ITEMS[CollaboratorProfile.Attendant],
      handleSidebarToggle,
    })

    render(<AppLayout />)

    expect(
      screen.getByRole('link', { name: 'Intakes' }).getAttribute('aria-current'),
    ).toBe('page')
  })

  it('does not treat nested dashboard paths as active', () => {
    useAppLayoutMock.mockReturnValue({
      pathname: `${ROUTES.home}/details`,
      isSidebarCollapsed: false,
      sidebarItems: SIDEBAR_ITEMS[CollaboratorProfile.Attendant],
      handleSidebarToggle,
    })

    render(<AppLayout />)

    expect(
      screen.getByRole('link', { name: 'Dashboard' }).getAttribute('aria-current'),
    ).toBeNull()
  })
})
