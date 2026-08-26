import type { UseCase } from '../../shared/interfaces'
import type { FormalizationDetails } from '../domain/entities'
import {
  FormalizationNotFoundError,
} from '../domain/errors'
import type { FormalizationActor } from '../domain/structures'
import type { FormalizationSourceReader, FormalizationsRepository } from '../interfaces'
import { FormalizationActorAuthorization } from './formalization-actor-authorization'

type Request = FormalizationActor & {
  readonly formalizationId: string
}

export class GetFormalizationUseCase implements UseCase<Request, FormalizationDetails> {
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly sourceReader: FormalizationSourceReader,
  ) {}

  async execute(request: Request): Promise<FormalizationDetails> {
    const formalization = await this.formalizationsRepository.findById(request.formalizationId)
    if (!formalization) throw new FormalizationNotFoundError()
    FormalizationActorAuthorization.assertAccess(formalization.assignedLawyerId, request)
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
