import type { DatetimeProvider, IdProvider } from '../../shared/interfaces'
import type {
  FormalizationActor,
  FormalizationSignatureConfiguration,
} from '../domain/structures'
import {
  FormalizationNotFoundError,
  FormalizationSignatureAssignmentError,
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
  readonly signatoryId: string
  readonly documentIds: readonly string[]
  readonly expectedVersion: number
}

export class ReplaceFormalizationSignatoryDocumentsUseCase extends FormalizationSignatureConfigurationUseCase<
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
    const signatory = this.findSignatureSignatory(configuration, request.signatoryId)
    const uniqueDocumentIds = new Set(request.documentIds)
    if (uniqueDocumentIds.size !== request.documentIds.length) {
      throw new FormalizationSignatureAssignmentError(
        'Um documento não pode ser atribuído duas vezes ao mesmo signatário.',
      )
    }
    const sourceDocuments = await this.sourceReader.listCurrentDocuments(formalization.id)
    const sourceDocumentIds = new Set(sourceDocuments.map(({ documentId }) => documentId))
    if (request.documentIds.some((documentId) => !sourceDocumentIds.has(documentId))) {
      throw new FormalizationSignatureAssignmentError(
        'A atribuição contém um documento que não pertence ao pacote atual.',
      )
    }

    const nextConfiguration: FormalizationSignatureConfiguration = {
      ...configuration,
      signatories: configuration.signatories.map((item) =>
        item.signatoryId === signatory.signatoryId
          ? { ...item, documentIds: [...request.documentIds] }
          : item,
      ),
      documents: configuration.documents.map((document) => ({
        ...document,
        fields: request.documentIds.includes(document.documentId)
          ? document.fields
          : document.fields.filter(
              ({ signatoryId }) => signatoryId !== request.signatoryId,
            ),
      })),
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
