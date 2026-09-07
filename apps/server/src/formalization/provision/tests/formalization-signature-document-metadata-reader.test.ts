import { createHash } from 'node:crypto'

import type { FormalizationSignatureConfigurationRepository } from '@hms/core/formalization/interfaces'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'
import { describe, expect, it, vi } from 'vitest'

import { FormalizationSignatureDocumentMetadataReader } from '../formalization-signature-document-metadata-reader'

describe('Formalization Signature Document Metadata Reader', () => {
  it('reads metadata from the ready PDF preview instead of the source document', async () => {
    const content = new Uint8Array([37, 80, 68, 70, 45, 49])
    const configurationRepository = {
      findReadyPreviewFileId: vi.fn().mockResolvedValue('preview-file-id'),
    } as unknown as FormalizationSignatureConfigurationRepository
    const fileStorage = {
      get: vi.fn().mockResolvedValue({
        file: { id: 'preview-file-id' },
        content,
      }),
    } as unknown as FileStorageProvider
    const reader = new FormalizationSignatureDocumentMetadataReader(
      configurationRepository,
      fileStorage,
    )

    await expect(
      reader.findMetadata({
        formalizationId: 'formalization-id',
        previewId: 'preview-id',
      }),
    ).resolves.toEqual({
      privateFileId: 'preview-file-id',
      sha256: createHash('sha256').update(content).digest('hex'),
      byteCount: content.byteLength,
    })
    expect(configurationRepository.findReadyPreviewFileId).toHaveBeenCalledWith(
      'formalization-id',
      'preview-id',
    )
    expect(fileStorage.get).toHaveBeenCalledWith('preview-file-id')
  })

  it('returns no metadata when the preview is not ready', async () => {
    const configurationRepository = {
      findReadyPreviewFileId: vi.fn().mockResolvedValue(null),
    } as unknown as FormalizationSignatureConfigurationRepository
    const fileStorage = { get: vi.fn() } as unknown as FileStorageProvider
    const reader = new FormalizationSignatureDocumentMetadataReader(
      configurationRepository,
      fileStorage,
    )

    await expect(
      reader.findMetadata({
        formalizationId: 'formalization-id',
        previewId: 'preview-id',
      }),
    ).resolves.toBeNull()
    expect(fileStorage.get).not.toHaveBeenCalled()
  })
})
