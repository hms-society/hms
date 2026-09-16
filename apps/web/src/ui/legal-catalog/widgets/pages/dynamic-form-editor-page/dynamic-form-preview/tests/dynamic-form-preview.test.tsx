import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DynamicFormPreview } from '../index'

describe('dynamic-form-preview', () => {
  it('renders an accessible preview control with its default value', () => {
    render(
      <DynamicFormPreview
        fields={[
          {
            clientId: 'field-1',
            label: 'Nome',
            type: 'short_text',
            required: true,
            description: 'Informe o nome completo da pessoa.',
            defaultValue: 'Maria',
          },
        ]}
      />,
    )
    const input = screen.getByRole('textbox', { name: /Nome\s*\*/ })
    expect((input as HTMLInputElement).value).toBe('Maria')
    expect(screen.queryByText('Informe o nome completo da pessoa.')).toBeNull()
    fireEvent.change(input, { target: { value: 'João' } })
    expect((input as HTMLInputElement).value).toBe('João')
  })

  it('renders preview fields in a single column', () => {
    const { container } = render(
      <DynamicFormPreview
        fields={[
          {
            clientId: 'field-1',
            label: 'Primeiro campo',
            type: 'short_text',
            required: false,
          },
          {
            clientId: 'field-2',
            label: 'Segundo campo',
            type: 'short_text',
            required: false,
          },
        ]}
      />,
    )

    expect(container.querySelector('.grid')?.className).toContain('grid-cols-1')
    expect(container.querySelector('.grid')?.className).not.toContain('md:grid-cols-2')
  })

  it('renders checkbox fields with a transparent resting surface', () => {
    render(
      <DynamicFormPreview
        fields={[
          {
            clientId: 'field-1',
            label: 'Possui exclusividade?',
            type: 'boolean',
            required: true,
          },
        ]}
      />,
    )

    const checkboxLabel = screen.getByText('Possui exclusividade?').closest('label')
    expect(checkboxLabel?.className).toContain('bg-transparent')
    expect(checkboxLabel?.className).not.toContain('bg-background')
  })
})
