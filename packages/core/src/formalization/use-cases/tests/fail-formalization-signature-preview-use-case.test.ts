import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { FormalizationSignatureConfigurationRepository } from '../../interfaces'
import { FailFormalizationSignaturePreviewUseCase } from '../fail-formalization-signature-preview-use-case'

describe('Fail Formalization Signature Preview Use Case', () => {
  it('records a safe terminal failure for the current attempt token', async () => {
    const repository = mock<FormalizationSignatureConfigurationRepository>()
    const failedAt = new Date('2026-08-26T12:00:00.000Z')
    await new FailFormalizationSignaturePreviewUseCase(repository).execute({
      previewId: 'preview-id',
      attemptToken: 'attempt-token',
      failureCode: 'conversion_unavailable',
      failedAt,
    })
    expect(repository.failPreview).toHaveBeenCalledWith({
      previewId: 'preview-id',
      attemptToken: 'attempt-token',
      failureCode: 'conversion_unavailable',
      failedAt,
    })
  })
})
