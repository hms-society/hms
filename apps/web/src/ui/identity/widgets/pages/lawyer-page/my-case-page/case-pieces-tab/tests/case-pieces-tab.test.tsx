import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DossierGateBanner } from '../dossier-gate-banner'
import { mapCaseDocumentToPiece } from '../index'

describe('DossierGateBanner', () => {
  it('does not render invented approval metadata', () => {
    render(<DossierGateBanner approved />)

    expect(screen.getByText('Dossiê aprovado')).toBeDefined()
    expect(screen.queryByText(/14\/07|7 documentos|Ricardo Mendes/)).toBeNull()
  })
})

describe('mapCaseDocumentToPiece', () => {
  it('keeps the query cache shape as CasePiece after mapping a document', () => {
    const piece = mapCaseDocumentToPiece({
      id: 'document-1',
      title: 'Petição inicial',
      generation: { id: 'generation-1', status: 'pending' },
      versions: [
        {
          id: 'version-1',
          versionNumber: 1,
          source: 'ai',
          status: 'in_review',
          createdAt: '2026-07-14T12:00:00.000Z',
          createdByCollaboratorId: 'collaborator-1',
          pendingVariables: [],
        },
      ],
    })

    expect(piece).toMatchObject({
      id: 'document-1',
      title: 'Petição inicial',
      status: 'Gerando minuta',
      versions: [{ id: 'version-1', label: 'v1', title: 'Em revisão' }],
    })
    expect('generation' in piece).toBe(false)
  })
})
