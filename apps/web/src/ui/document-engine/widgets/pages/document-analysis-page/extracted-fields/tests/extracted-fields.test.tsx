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
      extractedCount: 1,
      getFieldIcon: vi.fn(() => 'file-text' as const),
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('shows the extraction count and fallback for missing values', () => {
    render(
      <ExtractedFields
        title='Campos extraídos'
        fields={[
          { label: 'Titular', value: 'Mariana Costa Silva' },
          { label: 'CPF', value: '', isMissing: true },
        ]}
      />,
    )

    expect(screen.getByText('Campos extraídos')).toBeDefined()
    expect(screen.getByText('1 de 2')).toBeDefined()
    expect((screen.getByLabelText('Titular') as HTMLInputElement).value).toBe(
      'Mariana Costa Silva',
    )
    expect((screen.getByLabelText('CPF') as HTMLInputElement).value).toBe(
      'Não identificado',
    )
  })
})
