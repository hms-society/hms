import { describe, expect, it } from 'vitest'
import {
  DocumentReviewDecision,
  DocumentReviewFindingCategory,
} from '@hms/core/document-production/domain/structures'

import { documentReviewSchema } from '@/document-production/ai/mastra/schemas/document-review-schema'

const finding = {
  category: DocumentReviewFindingCategory.Structure,
  description: 'The draft omitted a template paragraph.',
  correction: 'Restore the omitted paragraph.',
}

describe('Document Review Schema', () => {
  it('accepts an approved review without findings', () => {
    expect(
      documentReviewSchema.safeParse({
        decision: DocumentReviewDecision.Approved,
        findings: [],
      }).success,
    ).toBe(true)
  })

  it('accepts a review requiring changes with findings', () => {
    expect(
      documentReviewSchema.safeParse({
        decision: DocumentReviewDecision.ChangesRequired,
        findings: [finding],
      }).success,
    ).toBe(true)
  })

  it.each([
    {
      decision: DocumentReviewDecision.Approved,
      findings: [finding],
    },
    {
      decision: DocumentReviewDecision.ChangesRequired,
      findings: [],
    },
  ])('rejects a contradictory review', (review) => {
    expect(documentReviewSchema.safeParse(review).success).toBe(false)
  })
})
