import type { FormalizationDetails } from '../domain/entities'
import { FormalizationNotFoundError } from '../domain/errors'
import type { FormalizationActor } from '../domain/structures'
import type { FormalizationSourceReader, FormalizationsRepository } from '../interfaces'
import { FormalizationUseCase } from './formalization-use-case'

type Request = FormalizationActor & {
  readonly formalizationId: string
}

export class GetFormalizationUseCase extends FormalizationUseCase<
  Request,
  FormalizationDetails
> {
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly sourceReader: FormalizationSourceReader,
  ) {
    super()
  }

  async execute(request: Request): Promise<FormalizationDetails> {
    const formalization = await this.formalizationsRepository.findById(
      request.formalizationId,
    )

    if (!formalization) throw new FormalizationNotFoundError()
    this.assertAccess(formalization.assignedLawyerId, request)
    const context = await this.sourceReader.findContext(formalization)
    if (!context) throw new FormalizationNotFoundError()

    return {
      formalization,
      intake: context.intake,
      consultation: context.consultation,
      client: context.client,
      assignedLawyer: context.assignedLawyer,
    }
  }
}
