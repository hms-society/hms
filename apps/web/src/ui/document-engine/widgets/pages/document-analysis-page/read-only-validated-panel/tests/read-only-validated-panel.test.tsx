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

  it('preserves long case and checklist item names in a responsive layout', () => {
    const caseLabel =
      'Aposentadoria especial por exposição contínua a agentes nocivos em ambiente hospitalar'
    const checklistItemLabel =
      'Comprovante atualizado de residência emitido em nome do requerente ou representante legal'
    const document = DocumentValidationDocumentFaker.fake({
      checklistLink: { caseLabel, checklistItemLabel },
    })

    render(<ReadOnlyValidatedPanel document={document} />)

    const caseText = screen.getByText(caseLabel)
    const checklistItemText = screen.getByText(checklistItemLabel)
    const fieldsGrid = screen.getAllByText('Caso')[0].closest('dl')

    expect(caseText.closest('dd')).not.toBeNull()
    expect(caseText.closest('dd')?.className).toContain('min-h-10')
    expect(caseText.closest('dd')?.querySelector('svg')?.getAttribute('class')).toContain(
      'shrink-0',
    )
    expect(caseText.className).toContain('min-w-0')
    expect(caseText.className).toContain('break-words')
    expect(checklistItemText.closest('dd')).not.toBeNull()
    expect(checklistItemText.closest('dd')?.className).toContain('min-h-10')
    expect(
      checklistItemText.closest('dd')?.querySelector('svg')?.getAttribute('class'),
    ).toContain('shrink-0')
    expect(checklistItemText.className).toContain('min-w-0')
    expect(checklistItemText.className).toContain('break-words')
    expect(fieldsGrid?.className).toContain('grid-cols-1')
    expect(fieldsGrid?.className).toContain('@2xl:grid-cols-2')
  })
})
