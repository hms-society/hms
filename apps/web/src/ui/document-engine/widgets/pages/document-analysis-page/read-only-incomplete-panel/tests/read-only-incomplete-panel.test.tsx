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
          sender: 'remetente@email.com',
          extractedFields: [{ label: 'Titular', value: 'Mariana Costa Silva' }],
          missingFields: ['Data de emissão'],
        })}
      />,
    )

    expect(screen.getAllByText('Reenvio solicitado')).toHaveLength(2)
    expect(screen.getByText(/Enviado para Mariana Costa Silva/)).toBeDefined()
    expect(screen.getByText('Data de emissão')).toBeDefined()
    expect(screen.getAllByText('Somente leitura')).toHaveLength(2)
  })
})
