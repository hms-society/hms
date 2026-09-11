import { describe, expect, it } from 'vitest'

import { isFormalizationDocumentConfirmationEligible } from '../use-formalization-document-production-action'

const currentApprovedDocument = {
  isCurrent: true,
  status: 'approved',
  document: { isFresh: true },
}

describe('isFormalizationDocumentConfirmationEligible', () => {
  it('requires every document to have a fresh current approved version', () => {
    expect(
      isFormalizationDocumentConfirmationEligible([
        currentApprovedDocument,
        { ...currentApprovedDocument, isCurrent: false },
      ]),
    ).toBe(false)

    expect(
      isFormalizationDocumentConfirmationEligible([
        currentApprovedDocument,
        currentApprovedDocument,
      ]),
    ).toBe(true)
  })

  it('rejects empty, stale, and rejected document sets', () => {
    expect(isFormalizationDocumentConfirmationEligible([])).toBe(false)
    expect(
      isFormalizationDocumentConfirmationEligible([
        { ...currentApprovedDocument, document: { isFresh: false } },
      ]),
    ).toBe(false)
    expect(
      isFormalizationDocumentConfirmationEligible([
        { ...currentApprovedDocument, status: 'rejected' },
      ]),
    ).toBe(false)
  })
})
