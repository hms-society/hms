import type {
  FormalizationsRepository,
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureDocumentMetadataReader,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSourceReader,
} from '../interfaces'
import type { FormalizationSignatureSendingReview } from '../domain/structures/formalization-signature-sending-review'
import type { FormalizationSignatureSendingIssue } from '../domain/structures/formalization-signature-sending-issue'
import { FormalizationSignatureSendingIssueCode } from '../domain/structures/formalization-signature-sending-issue-code'
import { FormalizationSignatureStatus } from '../domain/structures'
import { CollaboratorProfile } from '../../identity/domain/structures'
import {
  FormalizationNotFoundError,
  FormalizationSignatureNotReadyError,
  FormalizationSignatureSendingForbiddenError,
} from '../domain/errors'
import type { UseCase } from '../../shared/interfaces/use-case'
import type { FormalizationActor } from '../domain/structures/formalization-actor'

type Request = {
  readonly formalizationId: string
  readonly actorId: string
  readonly actorProfile?: FormalizationActor['actorProfile']
}
type Response = FormalizationSignatureSendingReview

type Dependencies = {
  readonly formalizationsRepository: FormalizationsRepository
  readonly configurationRepository: FormalizationSignatureConfigurationRepository
  readonly sourceReader: FormalizationSignatureSourceReader
  readonly metadataReader: FormalizationSignatureDocumentMetadataReader
  readonly requestsRepository: FormalizationSignatureRequestsRepository
}

export class GetFormalizationSignatureSendingReviewUseCase
  implements UseCase<Request, Response>
{
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<Response> {
    const formalization = await this.dependencies.formalizationsRepository.findById(
      request.formalizationId,
    )
    if (!formalization) throw new FormalizationNotFoundError()
    if (
      formalization.assignedLawyerId !== request.actorId &&
      request.actorProfile !== CollaboratorProfile.Admin
    )
      throw new FormalizationSignatureSendingForbiddenError()

    const configuration =
      await this.dependencies.configurationRepository.findByFormalizationId(
        formalization.id,
      )
    const issues: FormalizationSignatureSendingIssue[] = []
    if (
      !configuration ||
      configuration.status !== FormalizationSignatureStatus.ReadyForSending
    ) {
      issues.push({ code: FormalizationSignatureSendingIssueCode.notReady })
    }
    if (configuration && !configuration.readiness.ready) {
      issues.push(
        ...configuration.readiness.issues.map((issue) => ({
          code: this.mapIssue(issue.code),
        })),
      )
    }

    const documentMetadata = configuration
      ? await Promise.all(
          configuration.documents.map((document) =>
            this.dependencies.metadataReader.findMetadata({
              formalizationId: formalization.id,
              previewId: document.preview?.previewId ?? '',
            }),
          ),
        )
      : []
    if (
      configuration &&
      documentMetadata.some(
        (metadata) => !metadata || !metadata.sha256 || metadata.byteCount <= 0,
      )
    )
      throw new FormalizationSignatureNotReadyError()
    const documents = configuration
      ? configuration.documents.map((document, index) => {
          const metadata = documentMetadata[index]
          if (
            !metadata ||
            !metadata.sha256 ||
            metadata.byteCount <= 0 ||
            !document.preview?.pageCount ||
            document.preview.pageCount <= 0
          )
            throw new FormalizationSignatureNotReadyError()
          return {
            id: document.documentId,
            title: document.name,
            position: index + 1,
            pageCount: document.preview.pageCount,
            unsignedSha256: metadata.sha256,
          }
        })
      : []
    const signatories = (configuration?.signatories ?? []).map((signatory) => ({
      id: signatory.signatoryId,
      displayName: signatory.name,
      actorKind:
        signatory.role === 'client' ? ('client' as const) : ('collaborator' as const),
      deliveryChannel: 'email' as const,
      documentIds: [...signatory.documentIds],
    }))
    const currentRequest =
      await this.dependencies.requestsRepository.findLatestByFormalizationId(
        formalization.id,
      )
    return {
      formalizationId: formalization.id,
      version: formalization.version,
      status:
        configuration?.status ?? FormalizationSignatureStatus.InitializationRequired,
      ready: issues.length === 0,
      documents,
      signatories,
      messagePreview: 'Solicitação de assinatura da formalização.',
      issues,
      ...(currentRequest
        ? {
            currentRequest: {
              id: currentRequest.id,
              status: currentRequest.status,
              version: currentRequest.version,
              signatureConfigurationVersion: currentRequest.signatureConfigurationVersion,
              openDocuments: 0,
              totalDocuments: documents.length,
            },
          }
        : {}),
    }
  }

  private mapIssue(code: string): FormalizationSignatureSendingIssue['code'] {
    if (code.includes('document'))
      return FormalizationSignatureSendingIssueCode.documentUnavailable
    if (code.includes('signatory') || code.includes('assignment'))
      return FormalizationSignatureSendingIssueCode.missingAssignment
    if (code.includes('channel'))
      return FormalizationSignatureSendingIssueCode.channelUnavailable
    return FormalizationSignatureSendingIssueCode.notReady
  }
}
