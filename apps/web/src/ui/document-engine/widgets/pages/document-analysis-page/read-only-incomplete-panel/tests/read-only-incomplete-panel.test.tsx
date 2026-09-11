import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DocumentValidationDocumentFaker } from '@hms/core/document-engine/domain/entities/fakers'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'

import { ReadOnlyIncompletePanel } from '..'

describe('ReadOnlyIncompletePanel', () => {
  it('renders the recorded resend decision as read-only', () => {
    render(
      <ReadOnlyIncompletePanel
        document={DocumentValidationDocumentFaker.fake({
          status: DocumentValidationStatus.ResendRequested,
          reviewedBy: '4d70cfbf-cae3-4f15-8365-e951f9fcb9e4',
          reviewedByName: 'Atendente HMS',
          reviewedAt: new Date('2026-09-10T12:00:00.000Z'),
          sender: 'remetente@email.com',
          extractedFields: [{ label: 'Titular', value: 'Mariana Costa Silva' }],
          missingFields: ['Data de emissão'],
        })}
      />,
    )

    expect(screen.getAllByText('Reenvio solicitado')).toHaveLength(1)
    expect(screen.getByText('Reenvio solicitado por Atendente HMS')).toBeDefined()
    expect(screen.getByText(/Registro feito em/)).toBeDefined()
    expect(screen.getByText(/Enviado para Mariana Costa Silva/)).toBeDefined()
    expect(screen.queryByText(/4d70cfbf-cae3-4f15-8365-e951f9fcb9e4/)).toBeNull()
    expect(screen.getByText('Data de emissão')).toBeDefined()
    expect(screen.getAllByText('Somente leitura')).toHaveLength(2)
  })
})
