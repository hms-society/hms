import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DocumentValidationDocumentFaker } from '@hms/core/document-engine/domain/entities/fakers'

import { useChecklistLinkFields } from '../use-checklist-link-fields'

describe('useChecklistLinkFields', () => {
  it('maps form selections and document links to display values', () => {
    const watch = vi.fn((field: string) => {
      if (field === 'documentTypeId') return 'document-type-1'
      return 'checklist-item-1'
    })

    const { result } = renderHook(() =>
      useChecklistLinkFields({
        document: DocumentValidationDocumentFaker.fake({
          checklistLink: {
            caseLabel: 'Caso 0089',
            checklistItemLabel: 'Comprovante de residência',
          },
        }),
        form: { watch } as never,
        isChecklistDisabled: true,
      }),
    )

    expect(result.current).toEqual({
      caseLabel: 'Caso 0089',
      checklistItemLabel: 'Comprovante de residência',
      checklistRequirementId: 'checklist-item-1',
      documentTypeId: 'document-type-1',
    })
    expect(watch).toHaveBeenCalledWith('documentTypeId')
    expect(watch).toHaveBeenCalledWith('checklistRequirementId')
  })
})
