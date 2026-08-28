import type { FormalizationActor } from '../domain/structures'
import { FormalizationNotFoundError } from '../domain/errors'
import {
  FormalizationSignatureReadinessIssueCode,
  FormalizationSignatureStatus,
} from '../domain/structures'
import type { FormalizationSignatureConfiguration } from '../domain/structures'
import type {
  FormalizationsRepository,
  FormalizationSignatureConfigurationRepository,
} from '../interfaces'
import { FormalizationUseCase } from './formalization-use-case'

type Request = FormalizationActor & {
  readonly formalizationId: string
}

export class GetFormalizationSignatureConfigurationUseCase extends FormalizationUseCase<
  Request,
  FormalizationSignatureConfiguration
> {
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly configurationRepository: FormalizationSignatureConfigurationRepository,
  ) {
    super()
  }

  async execute(request: Request): Promise<FormalizationSignatureConfiguration> {
    const formalization = await this.formalizationsRepository.findById(
      request.formalizationId,
    )

    if (!formalization) throw new FormalizationNotFoundError()
    this.assertAccess(formalization.assignedLawyerId, request)

    const configuration = await this.configurationRepository.findByFormalizationId(
      formalization.id,
    )
    if (configuration) return configuration

    const isInitializedRequired = Boolean(formalization.documentsConfirmedAt)
    return {
      formalizationId: formalization.id,
      version: formalization.version,
      editable: false,
      status: isInitializedRequired
        ? FormalizationSignatureStatus.InitializationRequired
        : FormalizationSignatureStatus.Locked,
      previewPreparation: {
        total: 0,
        pending: 0,
        processing: 0,
        ready: 0,
        failed: 0,
      },
      signatories: [],
      documents: [],
      readiness: {
        ready: false,
        assignmentCount: 0,
        issues: [
          {
            path: 'configuration',
            code: isInitializedRequired
              ? FormalizationSignatureReadinessIssueCode.InitializationRequired
              : FormalizationSignatureReadinessIssueCode.PackageUnconfirmed,
          },
        ],
      },
    }
  }
}
