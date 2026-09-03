import { FormalizationUseCase } from './formalization-use-case'
import type {
  FormalizationActor,
  FormalizationSignatureCandidatePage,
} from '../domain/structures'
import { FormalizationNotFoundError } from '../domain/errors'
import type {
  FormalizationsRepository,
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureSourceReader,
} from '../interfaces'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly page?: number
  readonly limit?: number
  readonly search?: string
}

export class ListFormalizationSignatureCandidatesUseCase extends FormalizationUseCase<
  Request,
  FormalizationSignatureCandidatePage
> {
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly configurationRepository: FormalizationSignatureConfigurationRepository,
    private readonly sourceReader: FormalizationSignatureSourceReader,
  ) {
    super()
  }

  async execute(request: Request): Promise<FormalizationSignatureCandidatePage> {
    const formalization = await this.formalizationsRepository.findById(
      request.formalizationId,
    )

    if (!formalization) throw new FormalizationNotFoundError()
    this.assertAccess(formalization.assignedLawyerId, request)
    const configuration = await this.configurationRepository.findByFormalizationId(
      formalization.id,
    )

    const excludedPersonIds =
      configuration?.signatories.map(({ personId }) => personId) ?? []

    return this.sourceReader.listEligibleCandidates({
      formalizationId: formalization.id,
      page: request.page ?? 1,
      limit: request.limit ?? 20,
      ...(request.search ? { search: request.search } : {}),
      excludedPersonIds,
    })
  }
}
