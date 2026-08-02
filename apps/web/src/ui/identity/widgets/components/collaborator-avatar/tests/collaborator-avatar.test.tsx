import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CollaboratorAvatar } from '../index'

describe('CollaboratorAvatar', () => {
  it('renders initials from the first and last name', () => {
    render(<CollaboratorAvatar name='Mariana Costa' />)

    expect(screen.getByText('MC')).toBeTruthy()
  })

  it('renders up to two initials for a single-name collaborator', () => {
    render(<CollaboratorAvatar name='Sol' />)

    expect(screen.getByText('SO')).toBeTruthy()
  })

  it('keeps the color stable for the same collaborator name', () => {
    const { container, rerender } = render(
      <CollaboratorAvatar name='Mariana Costa' colorSeed='collaborator-1' />,
    )
    const firstAvatar = container.querySelector('[data-slot="avatar-fallback"]')

    rerender(<CollaboratorAvatar name='Mariana Costa' colorSeed='collaborator-1' />)
    const secondAvatar = container.querySelector('[data-slot="avatar-fallback"]')

    expect(firstAvatar?.className).toBe(secondAvatar?.className)
  })
})
