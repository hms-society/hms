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
})
