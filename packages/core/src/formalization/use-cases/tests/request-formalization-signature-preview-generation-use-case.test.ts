import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { Broker, DatetimeProvider } from '../../../shared/interfaces'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationsRepository,
} from '../../interfaces'
import { RequestFormalizationSignaturePreviewGenerationUseCase } from '../request-formalization-signature-preview-generation-use-case'
import {
  makeConfiguration,
  makeFormalization,
  TEST_NOW,
} from './signature-configuration-test-helpers'

describe('Request Formalization Signature Preview Generation Use Case', () => {
  it('moves a failed preview to pending and publishes an identifier-only event', async () => {
    const formalization = makeFormalization()
    const baseConfiguration = makeConfiguration()
    const baseDocument = baseConfiguration.documents[0]
    if (!baseDocument?.preview) throw new Error('Expected a preview fixture')
    const configuration = makeConfiguration({
      formalizationId: formalization.id,
      documents: [
        { ...baseDocument, preview: { ...baseDocument.preview, state: 'failed' } },
      ],
    })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const repository = mock<FormalizationSignatureConfigurationRepository>()
    const broker = mock<Broker>()
    const datetimeProvider = mock<DatetimeProvider>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    repository.findByFormalizationId.mockResolvedValue(configuration)
    repository.schedulePendingPreview.mockResolvedValue({
      previewId: 'preview-id',
      attemptToken: 'attempt-token',
      leaseExpiresAt: TEST_NOW,
    })
    datetimeProvider.now.mockReturnValue(TEST_NOW)

    await new RequestFormalizationSignaturePreviewGenerationUseCase(
      formalizationsRepository,
      repository,
      broker,
      datetimeProvider,
    ).execute({
      formalizationId: formalization.id,
      actorId: formalization.assignedLawyerId,
      previewId: 'preview-id',
      expectedVersion: formalization.version,
    })
    expect(broker.publish).toHaveBeenCalledOnce()
  })
})
