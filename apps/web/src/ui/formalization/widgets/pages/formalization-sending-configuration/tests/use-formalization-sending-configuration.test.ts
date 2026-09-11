import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useFormalizationSendingConfiguration } from '../use-formalization-sending-configuration'

describe('useFormalizationSendingConfiguration', () => {
  it('starts on the signatories tab with the reset dialog closed', () => {
    const { result } = renderHook(() => useFormalizationSendingConfiguration())

    expect(result.current.activeTab).toBe('signatures')
    expect(result.current.isResetDialogOpen).toBe(false)
  })

  it.each(['signatures', 'fields'] as const)('changes the active tab to %s', (tab) => {
    const { result } = renderHook(() => useFormalizationSendingConfiguration())

    act(() => result.current.handleTabChange(tab))

    expect(result.current.activeTab).toBe(tab)
  })

  it('opens a warning before leaving the fields tab with unsaved changes', () => {
    const { result } = renderHook(() => useFormalizationSendingConfiguration())

    act(() => result.current.handleTabChange('fields'))
    act(() => result.current.handleFieldsDirtyChange(true))
    act(() => result.current.handleTabChange('signatures'))

    expect(result.current.activeTab).toBe('fields')
    expect(result.current.isUnsavedChangesDialogOpen).toBe(true)

    act(() => result.current.handleConfirmUnsavedChanges())

    expect(result.current.activeTab).toBe('signatures')
    expect(result.current.isUnsavedChangesDialogOpen).toBe(false)
  })

  it('keeps the fields tab active when the unsaved changes warning is cancelled', () => {
    const { result } = renderHook(() => useFormalizationSendingConfiguration())

    act(() => result.current.handleTabChange('fields'))
    act(() => result.current.handleFieldsDirtyChange(true))
    act(() => result.current.handleTabChange('signatures'))
    act(() => result.current.handleUnsavedChangesDialogOpenChange(false))

    expect(result.current.activeTab).toBe('fields')
    expect(result.current.isUnsavedChangesDialogOpen).toBe(false)
  })

  it('opens and closes the reset dialog', () => {
    const { result } = renderHook(() => useFormalizationSendingConfiguration())

    act(() => result.current.setIsResetDialogOpen(true))
    expect(result.current.isResetDialogOpen).toBe(true)

    act(() => result.current.setIsResetDialogOpen(false))
    expect(result.current.isResetDialogOpen).toBe(false)
  })

  it('confirms the ready configuration with an idempotency key', async () => {
    const confirmSending = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useFormalizationSendingConfiguration({
        canSend: true,
        expectedVersion: 2,
        sending: { confirmSending, isConfirming: false },
      }),
    )

    await act(async () => {
      await result.current.handleSend()
    })

    expect(confirmSending).toHaveBeenCalledWith({
      expectedVersion: 2,
      confirmationKey: expect.any(String),
    })
    expect(result.current.isSendDialogOpen).toBe(false)
  })
})
