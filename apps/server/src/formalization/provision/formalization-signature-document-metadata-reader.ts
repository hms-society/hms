import { createHash } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import type { FormalizationSignatureDocumentMetadataReader as FormalizationSignatureDocumentMetadataReaderPort } from '@hms/core/formalization/interfaces'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'

import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import type { FormalizationSignatureConfigurationRepository } from '@hms/core/formalization/interfaces'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'

@Injectable()
export class FormalizationSignatureDocumentMetadataReader
  implements FormalizationSignatureDocumentMetadataReaderPort
{
  constructor(
    @Inject(FORMALIZATION_PROVIDERS.signatureConfigurationRepository)
    private readonly configurationRepository: FormalizationSignatureConfigurationRepository,
    @Inject(PROVISION_PROVIDERS.fileStorage)
    private readonly fileStorage: FileStorageProvider,
  ) {}

  async findMetadata(input: { formalizationId: string; previewId: string }) {
    const previewFileId = await this.configurationRepository.findReadyPreviewFileId(
      input.formalizationId,
      input.previewId,
    )
    if (!previewFileId) return null
    const stored = await this.fileStorage.get(previewFileId)
    if (!stored) return null

    return {
      privateFileId: stored.file.id,
      sha256: createHash('sha256').update(stored.content).digest('hex'),
      byteCount: stored.content.byteLength,
    }
  }
}
