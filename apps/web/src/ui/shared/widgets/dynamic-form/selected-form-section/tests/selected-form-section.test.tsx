import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SelectedFormSection } from '../index'
import { useSelectedFormSection } from '../use-selected-form-section'

vi.mock('../use-selected-form-section', () => ({
  useSelectedFormSection: vi.fn(),
}))

describe('SelectedFormSection', () => {
  it('renders the shared selector and delegates opening it', () => {
    const onOpenSelectModal = vi.fn()
    vi.mocked(useSelectedFormSection).mockReturnValue({
      selectedFormName: 'Triagem inicial',
      legalArea: 'Cível',
      legalTheme: 'Família',
      fields: [],
      answers: {},
      errors: {},
      onChange: vi.fn(),
      onOpenSelectModal,
      isReadOnly: false,
    })

    render(
      <SelectedFormSection
        selectedFormName='Triagem inicial'
        legalArea='Cível'
        legalTheme='Família'
        fields={[]}
        answers={{}}
        errors={{}}
        onChange={vi.fn()}
        onOpenSelectModal={onOpenSelectModal}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Triagem inicial/ }))
    expect(onOpenSelectModal).toHaveBeenCalled()
  })
})
