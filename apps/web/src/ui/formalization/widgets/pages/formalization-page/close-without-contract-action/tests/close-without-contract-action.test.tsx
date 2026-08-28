import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CloseWithoutContractAction } from '../index'
import { useCloseWithoutContractAction } from '../use-close-without-contract-action'

vi.mock('../use-close-without-contract-action', () => ({
  useCloseWithoutContractAction: vi.fn(),
}))

const useCloseWithoutContractActionMock = vi.mocked(useCloseWithoutContractAction)
type Controller = ReturnType<typeof useCloseWithoutContractAction>

function fakeHook(overrides: Partial<Controller> = {}): Controller {
  return {
    error: null,
    handleConfirm: vi.fn(),
    handleOpenChange: vi.fn(),
    isEnabled: true,
    isOpen: false,
    isPending: false,
    notes: '',
    onNotesChange: vi.fn(),
    onReasonChange: vi.fn(),
    reason: '',
    ...overrides,
  }
}

describe('CloseWithoutContractAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCloseWithoutContractActionMock.mockReturnValue(fakeHook())
  })

  afterEach(cleanup)

  it('renders the enabled action and opens the dialog through its handler', () => {
    const handleOpenChange = vi.fn()
    useCloseWithoutContractActionMock.mockReturnValue(fakeHook({ handleOpenChange }))

    render(
      <CloseWithoutContractAction
        isEnabled
        mutation={{ isPending: false, error: null, mutate: vi.fn() }}
      />,
    )

    const action = screen.getByRole('button', { name: 'Encerrar sem contratação' })
    expect(action).not.toBeNull()
    expect((action as HTMLButtonElement).disabled).toBe(false)

    fireEvent.click(action)

    expect(handleOpenChange).toHaveBeenCalledWith(true)
  })

  it('renders the real dialog when the action is open', () => {
    useCloseWithoutContractActionMock.mockReturnValue(fakeHook({ isOpen: true }))

    render(
      <CloseWithoutContractAction
        isEnabled
        mutation={{ isPending: false, error: null, mutate: vi.fn() }}
      />,
    )

    expect(
      screen.getByRole('alertdialog', { name: 'Encerrar sem contratação?' }),
    ).not.toBeNull()
  })

  it('disables the action when the formalization is not active', () => {
    useCloseWithoutContractActionMock.mockReturnValue(fakeHook({ isEnabled: false }))

    render(
      <CloseWithoutContractAction
        isEnabled={false}
        mutation={{ isPending: false, error: null, mutate: vi.fn() }}
      />,
    )

    expect(
      (
        screen.getByRole('button', {
          name: 'Encerrar sem contratação',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
  })
})
