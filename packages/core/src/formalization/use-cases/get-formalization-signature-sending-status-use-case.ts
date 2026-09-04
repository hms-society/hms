import type { UseCase } from '../../shared/interfaces'
import {
  FormalizationSignatureRequestDocumentStatus,
  FormalizationSignatureRequestStatus,
} from '../domain/structures'
import { CollaboratorProfile } from '../../identity/domain/structures'
import {
  FormalizationNotFoundError,
  FormalizationSignatureRequestConflictError,
  FormalizationSignatureSendingForbiddenError,
} from '../domain/errors'
import type { FormalizationSignatureSendingStatusResponse } from '../domain/structures'
import type {
  FormalizationsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
} from '../interfaces'
import type { FormalizationActor } from '../domain/structures/formalization-actor'

type Request = {
  readonly formalizationId: string
  readonly actorId: string
  readonly actorProfile?: FormalizationActor['actorProfile']
}
type Response = FormalizationSignatureSendingStatusResponse
type Dependencies = {
  readonly formalizationsRepository: FormalizationsRepository
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly documentsRepository: FormalizationSignatureRequestDocumentsRepository
}

const terminalStatuses = new Set<FormalizationSignatureRequestStatus>([
  FormalizationSignatureRequestStatus.confirmed,
  FormalizationSignatureRequestStatus.rejected,
  FormalizationSignatureRequestStatus.cancelled,
  FormalizationSignatureRequestStatus.expired,
])
const retryableRequestStatuses = new Set<FormalizationSignatureRequestStatus>([
  FormalizationSignatureRequestStatus.reconciliationRequired,
  FormalizationSignatureRequestStatus.failed,
])
const retryableDocumentStatuses = new Set<FormalizationSignatureRequestDocumentStatus>([
  FormalizationSignatureRequestDocumentStatus.reconciliationRequired,
  FormalizationSignatureRequestDocumentStatus.failed,
])

export class GetFormalizationSignatureSendingStatusUseCase
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
    ) {
      throw new FormalizationSignatureSendingForbiddenError()
    }

    const signatureRequest =
      await this.dependencies.requestsRepository.findLatestByFormalizationId(
        formalization.id,
      )
    if (!signatureRequest) {
      throw new FormalizationSignatureRequestConflictError()
    }

    const documents = await this.dependencies.documentsRepository.listByRequestId(
      signatureRequest.id,
    )
    const failedDocuments = documents.filter((document) =>
      retryableDocumentStatuses.has(document.status),
    ).length
    const completedDocuments = documents.filter(
      (document) =>
        document.status === FormalizationSignatureRequestDocumentStatus.confirmed,
    ).length

    return {
      requestId: signatureRequest.id,
      status: signatureRequest.status,
      version: signatureRequest.version,
      totalDocuments: documents.length,
      completedDocuments,
      failedDocuments,
      canCancel: !terminalStatuses.has(signatureRequest.status),
      canRetry:
        retryableRequestStatuses.has(signatureRequest.status) || failedDocuments > 0,
    }
  }
}
