import { describe, expect, it } from 'vitest'
import { DocumentValidationDocumentFaker } from '@hms/core/document-engine/domain/entities/fakers'

import { getVisibleExtractedFields } from '../get-visible-extracted-fields'

describe('getVisibleExtractedFields', () => {
  it('hides unorganized fields and fields below the confidence threshold', () => {
    const document = DocumentValidationDocumentFaker.fake({
      aiSuggestion: { ollamaJsonOrganizationCaptured: true },
      extractedFields: [
        { label: 'Nome', value: 'Vinicius Lopes Machado', confidence: 0.96 },
        { label: 'Cidade', value: 'São José dos', confidence: 0.42 },
        { label: 'CEP', value: '12233-470' },
      ],
    })
    const visibleFields = getVisibleExtractedFields(document)

    expect(visibleFields).toEqual([
      { label: 'Nome', value: 'Vinicius Lopes Machado', confidence: 0.96 },
    ])
  })

  it('does not display first-pass fields before verified organization finishes', () => {
    const document = DocumentValidationDocumentFaker.fake({
      extractedFields: [
        { label: 'Nome', value: 'Nome possivelmente incorreto', confidence: 0.96 },
      ],
    })

    expect(getVisibleExtractedFields(document)).toEqual([])
  })

  it('shows manually corrected fields regardless of their original confidence', () => {
    const document = DocumentValidationDocumentFaker.fake({
      extractedFields: [{ label: 'Nome', value: 'Nome incorreto', confidence: 0.4 }],
      humanCorrection: {
        decision: 'validate',
        extractedFields: [{ label: 'Nome', value: 'Vinicius Lopes Machado' }],
      },
    })

    expect(getVisibleExtractedFields(document)).toEqual([
      { label: 'Nome', value: 'Vinicius Lopes Machado' },
    ])
  })
})
