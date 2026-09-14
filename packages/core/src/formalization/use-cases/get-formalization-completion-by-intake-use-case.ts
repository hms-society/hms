import { CollaboratorProfile } from '../../identity/domain/structures'
import type { UseCase } from '../../shared/interfaces'
import {
  FormalizationSignatureSendingForbiddenError,
} from '../domain/errors'
import type {
  FormalizationActor,
  FormalizationCompletionSummary,
} from '../domain/structures'
import type {
  FormalizationsRepository,
  FormalizationSignatureRequestsRepository,
} from '../interfaces'

type Request = FormalizationActor & { readonly intakeId: string }

export class GetFormalizationCompletionByIntakeUseCase
  implements UseCase<Request, FormalizationCompletionSummary | null>
{
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly requestsRepository: FormalizationSignatureRequestsRepository,
  ) {}

  async execute(request: Request): Promise<FormalizationCompletionSummary | null> {
    const formalization = await this.formalizationsRepository.findByIntakeId(request.intakeId)
    if (!formalization) return null
    if (
      formalization.assignedLawyerId !== request.actorId &&
      request.actorProfile !== CollaboratorProfile.Admin
    ) {
      throw new FormalizationSignatureSendingForbiddenError()
    }
    if (
      formalization.status !== 'completed' ||
      !formalization.completedAt ||
      !formalization.signatureRequestId
    ) {
      return null
    }

    const signatureRequest = await this.requestsRepository.findById(
      formalization.signatureRequestId,
    )
    if (!signatureRequest || signatureRequest.status !== 'confirmed') return null

    return {
      formalizationId: formalization.id,
      intakeId: formalization.intakeId,
      status: 'completed',
      completedAt: formalization.completedAt,
      signatureRequestId: signatureRequest.id,
      signatureStatus: 'confirmed',
    }
  }
}
