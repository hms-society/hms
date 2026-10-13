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
          createdByCollaboratorName: 'Beatriz Supervisora',
          pendingVariables: [],
        },
      ],
    })

    expect(piece).toMatchObject({
      id: 'document-1',
      title: 'Petição inicial',
      status: 'Gerando minuta',
      versions: [
        {
          id: 'version-1',
          label: 'v1',
          title: 'Em revisão',
          author: 'Beatriz Supervisora',
        },
      ],
    })
    expect('generation' in piece).toBe(false)
  })

  it('uses currentVersionId for the active status and marks older versions as historical', () => {
    const piece = mapCaseDocumentToPiece({
      id: 'document-1',
      title: 'Petição inicial',
      currentVersionId: 'version-1',
      versions: [
        {
          id: 'version-2',
          versionNumber: 2,
          source: 'manual',
          status: 'draft',
          createdAt: '2026-07-14T13:00:00.000Z',
          createdByCollaboratorId: 'collaborator-1',
          pendingVariables: [],
        },
        {
          id: 'version-1',
          versionNumber: 1,
          source: 'ai',
          status: 'approved',
          createdAt: '2026-07-14T12:00:00.000Z',
          createdByCollaboratorId: 'collaborator-1',
          pendingVariables: [],
        },
      ],
    })

    expect(piece.status).toBe('Aprovada')
    expect(piece.versions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'version-2', title: 'Histórica' }),
        expect.objectContaining({ id: 'version-1', title: 'Aprovada' }),
      ]),
    )
  })
})
