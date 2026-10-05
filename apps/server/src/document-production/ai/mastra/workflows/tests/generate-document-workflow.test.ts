import { DocumentReviewDecision } from '@hms/core/document-production/domain/structures'
import { describe, expect, it, vi } from 'vitest'

import { GenerateDocumentWorkflow } from '@/document-production/ai/mastra/workflows/generate-document-workflow'

describe('GenerateDocumentWorkflow', () => {
  it('returns the validated final workflow outcome instead of discarding it', async () => {
    const outcome = {
      status: DocumentReviewDecision.Approved,
      documentGenerationId: '00000000-0000-4000-8000-000000000001',
      documentVersionId: '00000000-0000-4000-8000-000000000002',
      attemptsCount: 1,
      draft: {
        content: { type: 'doc', content: [] },
      },
      pendingMarkers: [],
    }
    const start = vi.fn().mockResolvedValue({ status: 'success', result: outcome })
    const workflow = Object.assign(Object.create(GenerateDocumentWorkflow.prototype), {
      workflow: { createRun: vi.fn().mockResolvedValue({ start }) },
    }) as GenerateDocumentWorkflow

    const result = await workflow.run({} as never)

    expect(result).toEqual({
      status: outcome.status,
      documentGenerationId: outcome.documentGenerationId,
      documentVersionId: outcome.documentVersionId,
      attemptsCount: outcome.attemptsCount,
      pendingMarkersCount: 0,
    })
    expect(start).toHaveBeenCalledOnce()
  })
})
