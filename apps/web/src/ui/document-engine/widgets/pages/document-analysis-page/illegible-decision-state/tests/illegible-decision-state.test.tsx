import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { IllegibleDecisionState } from '..'

describe('IllegibleDecisionState', () => {
  it('explains why linking and extraction are unavailable', () => {
    render(<IllegibleDecisionState />)

    expect(screen.getByText('Vínculo indisponível')).toBeDefined()
    expect(screen.getByText('Extração indisponível')).toBeDefined()
  })
})
