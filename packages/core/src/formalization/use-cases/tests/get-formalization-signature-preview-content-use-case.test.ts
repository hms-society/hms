import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { FileStorageProvider } from '../../../shared/interfaces'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationsRepository,
} from '../../interfaces'
import { GetFormalizationSignaturePreviewContentUseCase } from '../get-formalization-signature-preview-content-use-case'
import {
  makeConfiguration,
  makeFormalization,
} from './signature-configuration-test-helpers'

describe('Get Formalization Signature Preview Content Use Case', () => {
  it('rechecks ownership and returns private content for a ready preview', async () => {
    const formalization = makeFormalization()
    const baseConfiguration = makeConfiguration()
    const baseDocument = baseConfiguration.documents[0]
    if (!baseDocument?.preview) throw new Error('Expected a preview fixture')
    const configuration = makeConfiguration({
      formalizationId: formalization.id,
      documents: [
        {
          ...baseDocument,
          preview: {
            ...baseDocument.preview,
            state: 'ready',
            fileId: 'pdf-file',
          } as never,
        },
      ],
    })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const repository = mock<FormalizationSignatureConfigurationRepository>()
    const storage = mock<FileStorageProvider>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    repository.findByFormalizationId.mockResolvedValue(configuration)
    repository.findReadyPreviewFileId.mockResolvedValue('pdf-file')
    const file = {
      id: 'pdf-file',
      filePath: 'private',
      fileName: 'preview.pdf',
      contentType: 'application/pdf',
      sizeInBytes: 4,
      createdAt: new Date(),
    }
    storage.get.mockResolvedValue({ file, content: new Uint8Array([1, 2, 3, 4]) })

    await expect(
      new GetFormalizationSignaturePreviewContentUseCase(
        formalizationsRepository,
        repository,
        storage,
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        previewId: 'preview-id',
      }),
    ).resolves.toEqual({ file, content: new Uint8Array([1, 2, 3, 4]) })
  })
})
