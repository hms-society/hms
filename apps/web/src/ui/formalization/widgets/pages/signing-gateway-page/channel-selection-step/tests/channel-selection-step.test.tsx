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
    expect(screen.getByRole('heading', { name: 'Confirme seu e-mail' })).toBeTruthy()
    expect(screen.getByText('a***@example.com')).toBeTruthy()
    expect(screen.getByRole('radio', { name: /a\*\*\*@example\.com/ })).toHaveProperty(
      'checked',
      true,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }))
    expect(handleContinue).toHaveBeenCalledOnce()
  })

  it('keeps continuation unavailable while the channel action is pending', () => {
    vi.mocked(useChannelSelectionStep).mockReturnValue({
      handleContinue: vi.fn(),
      handleSelect: vi.fn(),
      isPending: true,
      selectedChannelId: 'channel-1',
    })

    render(
      <ChannelSelectionStep
        channels={[
          { id: 'channel-1', kind: 'email', maskedDestination: 'a***@example.com' },
        ]}
        isPending
        onSelect={vi.fn()}
        onContinue={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Enviar código' }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('keeps continuation unavailable when no channel is available', () => {
    vi.mocked(useChannelSelectionStep).mockReturnValue({
      handleContinue: vi.fn(),
      handleSelect: vi.fn(),
      isPending: false,
      selectedChannelId: undefined,
    })

    render(
      <ChannelSelectionStep
        channels={[]}
        isPending={false}
        onSelect={vi.fn()}
        onContinue={vi.fn()}
      />,
    )

    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    expect(screen.getByRole('status').textContent).toContain(
      'Nenhum canal de confirmação está disponível',
    )
    expect(
      screen.getByRole('button', { name: 'Enviar código' }).hasAttribute('disabled'),
    ).toBe(true)
  })
})
