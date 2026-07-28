import type { PropsWithChildren } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/ui/shared/contexts/rest-context', () => ({
  RestContextProvider: ({ children }: PropsWithChildren) => <>{children}</>,
}))
vi.mock('@/ui/shared/contexts/auth-context', () => ({
  AuthContextProvider: ({ children }: PropsWithChildren) => <>{children}</>,
}))
vi.mock('@tanstack/react-router', () => ({
  HeadContent: () => null,
  Scripts: () => null,
}))
vi.mock('@tanstack/react-router-devtools', () => ({
  TanStackRouterDevtoolsPanel: () => null,
}))
vi.mock('@tanstack/react-devtools', () => ({
  TanStackDevtools: () => null,
}))

import { RootLayout } from '../index'

describe('RootLayout', () => {
  it('mounts the REST context around application content', () => {
    render(
      <RootLayout>
        <span>Application content</span>
      </RootLayout>,
    )

    expect(screen.getByText('Application content')).toBeTruthy()
  })
})
