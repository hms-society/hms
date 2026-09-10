import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ExtractedFields } from '..'
import { useExtractedFields } from '../use-extracted-fields'

vi.mock('../use-extracted-fields', () => ({
  useExtractedFields: vi.fn(),
}))

const useExtractedFieldsMock = vi.mocked(useExtractedFields)

describe('ExtractedFields', () => {
  beforeEach(() => {
    useExtractedFieldsMock.mockReturnValue({
      extractedCount: 3,
      getFieldIcon: vi.fn(() => 'file-text' as const),
      getFieldKey: vi.fn((field) => `${field.label}:${field.value}`),
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('shows every extracted field and fallback for missing values', () => {
    render(
      <ExtractedFields
        title='Campos extraídos'
        fields={[
          { label: 'Nome', value: 'Carlos Eduardo Ferreira', confidence: 0.9 },
          { label: 'Cargo', value: 'Analista de Sistemas' },
          { label: 'Cargo', value: 'Departamento Jurídico' },
          { label: 'CPF', value: '', isMissing: true },
        ]}
      />,
    )

    expect(screen.getByText('Campos extraídos')).toBeDefined()
    expect(screen.getByText('3 de 4')).toBeDefined()
    expect(screen.getByText('Nome')).toBeDefined()
    expect(screen.getByText('Carlos Eduardo Ferreira')).toBeDefined()
    expect(screen.getAllByText('Cargo')).toHaveLength(2)
    expect(screen.getByText('Analista de Sistemas')).toBeDefined()
    expect(screen.getByText('Departamento Jurídico')).toBeDefined()
    expect(screen.getByText('CPF')).toBeDefined()
    expect(screen.getByText('Não identificado')).toBeDefined()
    expect(screen.queryByText('90%')).toBeNull()
  })
})
