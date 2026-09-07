import type { DatetimeProvider, IdProvider } from '../../shared/interfaces'
import type {
  FormalizationActor,
  FormalizationSignatureConfiguration,
} from '../domain/structures'
import { CollaboratorProfile } from '../../identity/domain/structures'
import {
  FormalizationNotFoundError,
  FormalizationSignatoryDuplicateError,
  FormalizationSignatoryIneligibleError,
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
  readonly personId: string
  readonly expectedVersion: number
}

export class AddFormalizationSignatoryUseCase extends FormalizationSignatureConfigurationUseCase<
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
    if (!configuration.editable) throw new FormalizationSignatureNotInitializedError()
    if (configuration.signatories.some(({ personId }) => personId === request.personId)) {
      throw new FormalizationSignatoryDuplicateError()
    }
    const person = await this.sourceReader.findPerson(request.personId)
    if (
      !person ||
      (person.profile !== CollaboratorProfile.Lawyer &&
        person.profile !== CollaboratorProfile.Paralegal &&
        person.profile !== CollaboratorProfile.Supervisor)
    ) {
      throw new FormalizationSignatoryIneligibleError()
    }
    if (person.availableChannels.length === 0) {
      throw new FormalizationSignatureChannelUnavailableError()
    }

    const now = this.datetimeProvider.now()
    const nextConfiguration: FormalizationSignatureConfiguration = {
      ...configuration,
      signatories: [
        ...configuration.signatories,
        {
          signatoryId: this.idProvider.generate(),
          personId: person.personId,
          role: 'additional_collaborator',
          name: person.name,
          profile: person.profile,
          removable: true,
          availableChannels: person.availableChannels,
          selectedChannels: [],
          documentIds: [],
        },
      ],
    }

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
