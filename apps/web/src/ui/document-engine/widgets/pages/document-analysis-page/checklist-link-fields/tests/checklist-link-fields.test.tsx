import { cleanup, render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DocumentValidationDocumentFaker } from '@hms/core/document-engine/domain/entities/fakers'
import type { DocumentReviewFormData } from '@hms/validation/document-engine'

import { ChecklistLinkFields } from '..'
import { useChecklistLinkFields } from '../use-checklist-link-fields'

vi.mock('../use-checklist-link-fields', () => ({
  useChecklistLinkFields: vi.fn(),
}))

const useChecklistLinkFieldsMock = vi.mocked(useChecklistLinkFields)

describe('ChecklistLinkFields', () => {
  beforeEach(() => {
    useChecklistLinkFieldsMock.mockReturnValue({
      caseLabel: 'Caso 0089',
      checklistItemLabel: 'Comprovante de residência',
      checklistRequirementId: 'checklist-item-1',
      documentTypeId: 'document-type-1',
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the current link and disables checklist selection when requested', () => {
    function TestFields() {
      const form = useForm<DocumentReviewFormData>({
        defaultValues: {
          decision: 'not_linked',
          documentTypeId: 'document-type-1',
          checklistRequirementId: 'checklist-item-1',
        },
      })

      return (
        <ChecklistLinkFields
          document={DocumentValidationDocumentFaker.fake({
            checklistLink: {
              caseLabel: 'Caso 0089',
              checklistItemLabel: 'Comprovante de residência',
            },
          })}
          form={form}
          isChecklistDisabled
        />
      )
    }

    render(<TestFields />)

    expect((screen.getByLabelText('Caso') as HTMLSelectElement).value).toBe(
      'document-type-1',
    )
    expect(
      (screen.getByLabelText('Item do checklist') as HTMLSelectElement).disabled,
    ).toBe(true)

    expect(screen.getByText('Não vinculado')).toBeDefined()
  })
})
