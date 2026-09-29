import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PortalAccessDialog } from '../index'

describe('PortalAccessDialog', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders correctly with formatted expiration date and url', () => {
    const onCopy = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <PortalAccessDialog
        open
        url='https://hms.app/cases/case-123/portal-pendencies?portalToken=abc'
        expiresAt='2026-10-01T15:30:00.000Z'
        onCopy={onCopy}
        onOpenChange={onOpenChange}
      />,
    )

    expect(screen.getByText('Link para terceiro gerado')).toBeTruthy()
    expect(
      screen.getByDisplayValue(
        'https://hms.app/cases/case-123/portal-pendencies?portalToken=abc',
      ),
    ).toBeTruthy()

    const copyButton = screen.getByRole('button', { name: 'Copiar link' })
    fireEvent.click(copyButton)
    expect(onCopy).toHaveBeenCalledTimes(1)
  })

  it('handles null expiresAt and empty url gracefully', () => {
    render(
      <PortalAccessDialog
        open
        url={null}
        expiresAt={null}
        onCopy={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Link para terceiro gerado')).toBeTruthy()
  })
})
