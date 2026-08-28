import type { DatetimeProvider, IdProvider } from '../../shared/interfaces'
import type {
  FormalizationActor,
  FormalizationSignatureConfiguration,
} from '../domain/structures'
import {
  FormalizationNotFoundError,
  FormalizationSignatureNotInitializedError,
  FormalizationStateConflictError,
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
  readonly expectedVersion: number
  readonly confirmed: boolean
}

export class ResetFormalizationSignatureConfigurationUseCase extends FormalizationSignatureConfigurationUseCase<
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
    if (!request.confirmed) {
      throw new FormalizationStateConflictError(
        'A confirmação destrutiva é obrigatória para redefinir a configuração.',
      )
    }

    const configuration = await this.configurationRepository.findByFormalizationId(
      formalization.id,
    )
    if (!configuration) throw new FormalizationSignatureNotInitializedError()
    const nextConfiguration: FormalizationSignatureConfiguration = {
      ...configuration,
      signatories: configuration.signatories
        .filter(({ role }) => role !== 'additional_collaborator')
        .map((signatory) => ({
          ...signatory,
          selectedChannels: [],
          documentIds: [],
        })),
      documents: configuration.documents.map((document) => ({ ...document, fields: [] })),
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
