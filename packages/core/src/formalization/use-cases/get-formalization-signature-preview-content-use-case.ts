import type { FileStorageProvider } from '../../shared/interfaces'
import type { StoredFileContent } from '../../shared/domain/structures'
import {
  FormalizationNotFoundError,
  FormalizationSignatureDocumentVersionFileUnavailableError,
  FormalizationSignatureNotInitializedError,
  FormalizationSignaturePreviewNotReadyError,
} from '../domain/errors'
import type { FormalizationActor } from '../domain/structures'
import type {
  FormalizationsRepository,
  FormalizationSignatureConfigurationRepository,
} from '../interfaces'
import { FormalizationUseCase } from './formalization-use-case'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly previewId: string
}

export class GetFormalizationSignaturePreviewContentUseCase extends FormalizationUseCase<
  Request,
  StoredFileContent
> {
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly configurationRepository: FormalizationSignatureConfigurationRepository,
    private readonly fileStorageProvider: FileStorageProvider,
  ) {
    super()
  }

  async execute(request: Request): Promise<StoredFileContent> {
    const formalization = await this.formalizationsRepository.findById(
      request.formalizationId,
    )

    if (!formalization) throw new FormalizationNotFoundError()
    this.assertAccess(formalization.assignedLawyerId, request)
    const configuration = await this.configurationRepository.findByFormalizationId(
      formalization.id,
    )
    if (!configuration) throw new FormalizationSignatureNotInitializedError()

    const preview = configuration.documents
      .map(({ preview }) => preview)
      .find((item) => item?.previewId === request.previewId)
    if (!preview || (preview.state !== 'ready' && preview.state !== 'stale')) {
      throw new FormalizationSignaturePreviewNotReadyError()
    }
    const document = configuration.documents.find(
      ({ preview: item }) => item?.previewId === request.previewId,
    )
    if (!document) throw new FormalizationSignaturePreviewNotReadyError()
    const storedFileId = await this.configurationRepository.findReadyPreviewFileId(
      formalization.id,
      request.previewId,
    )
    if (!storedFileId)
      throw new FormalizationSignatureDocumentVersionFileUnavailableError()

    const storedFile = await this.fileStorageProvider.get(storedFileId)
    if (!storedFile) throw new FormalizationSignatureDocumentVersionFileUnavailableError()
    return storedFile
  }
}
