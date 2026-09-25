import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { DocumentValidationDocumentFaker } from '@hms/core/document-engine/domain/entities/fakers'

import { ReadOnlyValidatedPanel } from '..'

describe('ReadOnlyValidatedPanel', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows the reviewer name instead of the reviewer id', () => {
    const document = DocumentValidationDocumentFaker.fake({
      reviewedBy: '4d70cfbf-cae3-4f15-8365-e951f9fcb9e4',
      reviewedByName: 'Advogado de desenvolvimento',
      reviewedAt: new Date('2026-08-29T14:45:00.000Z'),
    })

    render(<ReadOnlyValidatedPanel document={document} />)

    expect(
      screen.getByText('Documento validado por Advogado de desenvolvimento'),
    ).toBeDefined()
    expect(
      screen.queryByText('Documento validado por 4d70cfbf-cae3-4f15-8365-e951f9fcb9e4'),
    ).toBeNull()
  })

  it('does not expose the reviewer id when the reviewer name is unavailable', () => {
    const document = DocumentValidationDocumentFaker.fake({
      reviewedBy: '4d70cfbf-cae3-4f15-8365-e951f9fcb9e4',
      reviewedByName: undefined,
      reviewedAt: new Date('2026-08-29T14:45:00.000Z'),
    })

    render(<ReadOnlyValidatedPanel document={document} />)

    expect(
      screen.getByText('Documento validado por responsável não identificado'),
    ).toBeDefined()
    expect(screen.queryByText(/4d70cfbf-cae3-4f15-8365-e951f9fcb9e4/)).toBeNull()
  })

  it('hides low-confidence extracted fields from the read-only result', () => {
    const document = DocumentValidationDocumentFaker.fake({
      aiSuggestion: { ollamaJsonOrganizationCaptured: true },
      extractedFields: [
        { label: 'Nome', value: 'Vinicius Lopes Machado', confidence: 0.96 },
        { label: 'Cidade', value: 'São José dos', confidence: 0.42 },
      ],
    })

    render(<ReadOnlyValidatedPanel document={document} />)

    expect(screen.getByText('Vinicius Lopes Machado')).toBeDefined()
    expect(screen.queryByText('São José dos')).toBeNull()
  })
})
