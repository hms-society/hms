import {
  DocumentFaker,
  DocumentGenerationFaker,
  DocumentVersionFaker,
} from '@hms/core/document-production/domain/entities/fakers'
import { describe, expect, it } from 'vitest'

import { CaseDocumentResponseDto } from '../case-document-response.dto'

describe('CaseDocumentResponseDto', () => {
  it('maps generation references and unresolved variables without exposing extracted values', () => {
    const generation = DocumentGenerationFaker.fake({
      source: {
        type: 'case',
        id: 'case-id',
        data: {
          referenceDocuments: [
            {
              id: 'reference-id',
              fileName: 'cnis.pdf',
              checklistItemLabel: 'Extrato previdenciário (CNIS)',
              extractedFields: [{ label: 'CPF', value: 'sensitive-value' }],
            },
          ],
        },
      },
      template: {
        name: 'Requerimento previdenciário',
        content: { type: 'doc' },
        variables: [
          {
            label: 'Períodos contributivos',
            technicalName: 'periodos_contributivos',
          },
        ],
      },
      status: 'completed',
    })
    const version = DocumentVersionFaker.fake({
      documentId: generation.documentId,
      documentGenerationId: generation.id,
      pendingMarkers: [{ marker: '{periodos_contributivos}' }],
      storagePath: 'generated/document.pdf',
    })

    const response = CaseDocumentResponseDto.fromDomain({
      document: DocumentFaker.fake({
        id: generation.documentId,
        currentVersionId: version.id,
      }),
      versions: [version],
      generation,
    })

    expect(response.generation?.referenceDocuments).toEqual([
      {
        id: 'reference-id',
        fileName: 'cnis.pdf',
        checklistItemLabel: 'Extrato previdenciário (CNIS)',
      },
    ])
    expect(response.versions[0].pendingVariables).toEqual([
      {
        marker: '{periodos_contributivos}',
        technicalName: 'periodos_contributivos',
        label: 'Períodos contributivos',
      },
    ])
    expect(JSON.stringify(response)).not.toContain('sensitive-value')
    expect(JSON.stringify(response)).not.toContain('extractedFields')
  })

  it('uses a readable label when a pending marker is absent from the generation template', () => {
    const generation = DocumentGenerationFaker.fake()
    const version = DocumentVersionFaker.fake({
      documentId: generation.documentId,
      documentGenerationId: generation.id,
      pendingMarkers: [{ marker: '{numero_beneficio}' }],
    })

    const response = CaseDocumentResponseDto.fromDomain({
      document: DocumentFaker.fake({ id: generation.documentId }),
      versions: [version],
      generation,
    })

    expect(response.versions[0].pendingVariables[0].label).toBe('numero beneficio')
  })
})
