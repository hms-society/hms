import type { DatetimeProvider, IdProvider } from '../../shared/interfaces'
import type {
  FormalizationActor,
  FormalizationSignatureConfiguration,
  FormalizationSignatureFieldView,
} from '../domain/structures'
import {
  FormalizationNotFoundError,
  FormalizationSignatureAssignmentError,
  FormalizationSignatureFieldError,
  FormalizationSignaturePreviewNotReadyError,
  FormalizationSignatureNotInitializedError,
  FormalizationVersionConflictError,
} from '../domain/errors'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureSourceReader,
  FormalizationsRepository,
} from '../interfaces'
import { FormalizationSignatureConfigurationUseCase } from './formalization-signature-configuration-use-case'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly documentId: string
  readonly previewId: string
  readonly fields: readonly FormalizationSignatureFieldView[]
  readonly expectedVersion: number
}

export class ReplaceFormalizationSignatureFieldsUseCase extends FormalizationSignatureConfigurationUseCase<
  Request,
  FormalizationSignatureConfiguration
> {
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly configurationRepository: FormalizationSignatureConfigurationRepository,
    private readonly sourceReader: FormalizationSignatureSourceReader,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly idProvider: IdProvider,
  ) {
    super()
  }

  async execute(request: Request): Promise<FormalizationSignatureConfiguration> {
    const formalization = await this.formalizationsRepository.findById(
      request.formalizationId,
    )

    if (!formalization) throw new FormalizationNotFoundError()
    this.assertAccess(formalization.assignedLawyerId, request)
    this.assertWritable(formalization)
    const configuration = await this.configurationRepository.findByFormalizationId(
      formalization.id,
    )

    if (!configuration) throw new FormalizationSignatureNotInitializedError()
    const document = this.findSignatureDocument(configuration, request.documentId)
    if (!document.preview || document.preview.previewId !== request.previewId) {
      throw new FormalizationSignaturePreviewNotReadyError()
    }
    if (document.preview.state !== 'ready') {
      throw new FormalizationSignaturePreviewNotReadyError()
    }

    const signatoryIds = new Set(
      configuration.signatories.map(({ signatoryId }) => signatoryId),
    )
    const assignedSignatoryIds = new Set(
      configuration.signatories
        .filter(({ documentIds }) => documentIds.includes(request.documentId))
        .map(({ signatoryId }) => signatoryId),
    )
    const fieldIds = new Set<string>()
    for (const field of request.fields) {
      if (field.previewId !== request.previewId || !signatoryIds.has(field.signatoryId)) {
        throw new FormalizationSignatureAssignmentError()
      }
      if (!assignedSignatoryIds.has(field.signatoryId)) {
        throw new FormalizationSignatureAssignmentError()
      }
      if (fieldIds.has(field.fieldId)) throw new FormalizationSignatureFieldError()
      fieldIds.add(field.fieldId)
      if (
        field.type !== 'signature' ||
        !Number.isInteger(field.page) ||
        field.page < 1 ||
        field.page > (document.preview.pageCount ?? 0) ||
        !Number.isFinite(field.positionX) ||
        !Number.isFinite(field.positionY) ||
        !Number.isFinite(field.width) ||
        !Number.isFinite(field.height) ||
        field.positionX < 0 ||
        field.positionY < 0 ||
        field.width <= 0 ||
        field.height <= 0 ||
        field.positionX + field.width > 100 ||
        field.positionY + field.height > 100
      ) {
        throw new FormalizationSignatureFieldError()
      }
    }

    const nextConfiguration: FormalizationSignatureConfiguration = {
      ...configuration,
      documents: configuration.documents.map((item) =>
        item.documentId === request.documentId
          ? { ...item, fields: [...request.fields] }
          : item,
      ),
    }

    const now = this.datetimeProvider.now()
    const state = await this.buildSignaturePersistenceState(
      nextConfiguration,
      formalization.id,
      request.actorId,
      now,
      this.sourceReader,
      this.idProvider,
    )

    const updated = await this.configurationRepository.replaceConfiguration({
      formalizationId: formalization.id,
      expectedFormalizationVersion: request.expectedVersion,
      actorId: request.actorId,
      occurredAt: now,
      ...state,
    })
    if (!updated) throw new FormalizationVersionConflictError()
    return updated
  }
}
