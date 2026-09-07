import type { UseCase } from '../../shared/interfaces'
import type { FormalizationSignaturePreviewFailureCode } from '../domain/structures'
import type { FormalizationSignatureConfigurationRepository } from '../interfaces'

type Request = {
  readonly previewId: string
  readonly attemptToken: string
  readonly failureCode: FormalizationSignaturePreviewFailureCode
  readonly failedAt: Date
}

export class FailFormalizationSignaturePreviewUseCase implements UseCase<Request> {
  constructor(
    private readonly configurationRepository: FormalizationSignatureConfigurationRepository,
  ) {}

  async execute(request: Request): Promise<void> {
    await this.configurationRepository.failPreview(request)
  }
}
