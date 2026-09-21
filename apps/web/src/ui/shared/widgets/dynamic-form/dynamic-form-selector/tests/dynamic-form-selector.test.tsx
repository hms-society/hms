import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormSelector } from '../index'
import { useDynamicFormSelector } from '../use-dynamic-form-selector'

vi.mock('../use-dynamic-form-selector', () => ({
  useDynamicFormSelector: vi.fn(),
}))

describe('DynamicFormSelector', () => {
  it('opens the selector and exposes the selected form', () => {
    const onOpenSelectModal = vi.fn()
    vi.mocked(useDynamicFormSelector).mockReturnValue({
      context: 'Cível · Família',
      handleOpenSelectModal: onOpenSelectModal,
      isDisabled: false,
    })

    render(
      <DynamicFormSelector
        selectedFormName='Triagem inicial'
        legalArea='Cível'
        legalTheme='Família'
        onOpenSelectModal={onOpenSelectModal}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Triagem inicial/ }))
    expect(onOpenSelectModal).toHaveBeenCalled()
    expect(screen.getByText('Cível · Família').textContent).toBe('Cível · Família')
  })
})
