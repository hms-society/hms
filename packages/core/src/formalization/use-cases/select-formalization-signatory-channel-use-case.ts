import type { DatetimeProvider, IdProvider } from '../../shared/interfaces'
import type { CommunicationChannel } from '../../communication/domain/structures'
import type {
  FormalizationActor,
  FormalizationSignatureConfiguration,
} from '../domain/structures'
import {
  FormalizationNotFoundError,
  FormalizationSignatureChannelUnavailableError,
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
  readonly channel: CommunicationChannel
  readonly selected: boolean
  readonly expectedVersion: number
}

export class SelectFormalizationSignatoryChannelUseCase extends FormalizationSignatureConfigurationUseCase<
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
    const person = await this.sourceReader.findPerson(signatory.personId)
    const availableChannels = person?.availableChannels ?? signatory.availableChannels
    if (!availableChannels.includes(request.channel)) {
      throw new FormalizationSignatureChannelUnavailableError()
    }
    const nextConfiguration: FormalizationSignatureConfiguration = {
      ...configuration,
      signatories: configuration.signatories.map((item) =>
        item.signatoryId === request.signatoryId
          ? {
              ...item,
              availableChannels,
              selectedChannels: request.selected
                ? [...new Set([...item.selectedChannels, request.channel])]
                : item.selectedChannels.filter((channel) => channel !== request.channel),
            }
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
