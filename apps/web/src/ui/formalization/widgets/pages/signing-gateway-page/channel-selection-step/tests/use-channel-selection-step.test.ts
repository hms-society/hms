import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useChannelSelectionStep } from '../use-channel-selection-step'

describe('useChannelSelectionStep', () => {
  it('tracks the selected server-provided channel and delegates both actions', () => {
    const onSelect = vi.fn()
    const onContinue = vi.fn()
    const { result } = renderHook(() =>
      useChannelSelectionStep({
        channels: [
          { id: 'channel-1', kind: 'email', maskedDestination: 'a***@example.com' },
        ],
        isPending: false,
        onSelect,
        onContinue,
      }),
    )

    act(() => result.current.handleSelect('channel-1'))
    expect(result.current.selectedChannelId).toBe('channel-1')
    expect(onSelect).toHaveBeenCalledWith('channel-1')
    act(() => result.current.handleContinue())
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it('starts from a previously selected channel and preserves pending state', () => {
    const { result } = renderHook(() =>
      useChannelSelectionStep({
        channels: [
          { id: 'channel-1', kind: 'email', maskedDestination: 'a***@example.com' },
        ],
        selectedChannelId: 'channel-1',
        isPending: true,
        onSelect: vi.fn(),
        onContinue: vi.fn(),
      }),
    )

    expect(result.current.selectedChannelId).toBe('channel-1')
    expect(result.current.isPending).toBe(true)
  })
})
