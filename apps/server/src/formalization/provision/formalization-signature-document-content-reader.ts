import { Inject, Injectable } from '@nestjs/common'
import type { FormalizationSignatureDocumentContentReader as FormalizationSignatureDocumentContentReaderContract } from '@hms/core/formalization/interfaces'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'

import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'

@Injectable()
export class FormalizationSignatureDocumentContentReader
  implements FormalizationSignatureDocumentContentReaderContract
{
  constructor(
    @Inject(PROVISION_PROVIDERS.fileStorage)
    private readonly fileStorage: FileStorageProvider,
  ) {}

  async readContent(privateFileId: string): Promise<Uint8Array | null> {
    const file = await this.fileStorage.get(privateFileId)
    return file ? new Uint8Array(file.content) : null
  }
}
