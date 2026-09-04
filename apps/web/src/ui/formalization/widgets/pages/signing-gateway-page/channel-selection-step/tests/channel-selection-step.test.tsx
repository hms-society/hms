import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ChannelSelectionStep } from '../index'
import { useChannelSelectionStep } from '../use-channel-selection-step'

vi.mock('../use-channel-selection-step', () => ({ useChannelSelectionStep: vi.fn() }))

describe('ChannelSelectionStep', () => {
  afterEach(cleanup)

  it('renders the server-masked channel and delegates selection', () => {
    const handleContinue = vi.fn()
    vi.mocked(useChannelSelectionStep).mockReturnValue({
      handleContinue,
      handleSelect: vi.fn(),
      isPending: false,
      selectedChannelId: undefined,
    })
    render(
      <ChannelSelectionStep
        channels={[
          { id: 'channel-1', kind: 'email', maskedDestination: 'a***@example.com' },
        ]}
        isPending={false}
        onSelect={vi.fn()}
        onContinue={vi.fn()}
      />,
    )
    expect(screen.getByText('a***@example.com')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }))
    expect(handleContinue).toHaveBeenCalledOnce()
  })
})
