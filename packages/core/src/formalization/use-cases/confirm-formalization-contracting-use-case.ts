import { CollaboratorProfile } from '../../identity/domain/structures'
import type { DatetimeProvider, UseCase } from '../../shared/interfaces'
import type {
  FormalizationContractingResult,
  ConfirmFormalizationContractingCommand,
  FormalizationActor,
} from '../domain/structures'
import {
  FormalizationContractingConflictError,
  FormalizationContractingNotReadyError,
  FormalizationNotFoundError,
  FormalizationSignatureSendingForbiddenError,
} from '../domain/errors'
import { FormalizationSignatureRequestDocumentStatus } from '../domain/structures'
import type {
  FormalizationsRepository,
  FormalizationContractingTransaction,
  FormalizationSignatureArtifactsRepository,
  FormalizationSignatureProtocolsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
} from '../interfaces'

type Request = ConfirmFormalizationContractingCommand &
  FormalizationActor & { readonly formalizationId: string }
type Dependencies = {
  readonly formalizationsRepository: FormalizationsRepository
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly documentsRepository: FormalizationSignatureRequestDocumentsRepository
  readonly recipientsRepository: FormalizationSignatureRecipientsRepository
  readonly artifactsRepository: FormalizationSignatureArtifactsRepository
  readonly protocolsRepository: FormalizationSignatureProtocolsRepository
  readonly transaction: FormalizationContractingTransaction
  readonly datetimeProvider: DatetimeProvider
}

export class ConfirmFormalizationContractingUseCase
  implements UseCase<Request, FormalizationContractingResult>
{
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<FormalizationContractingResult> {
    const formalization = await this.dependencies.formalizationsRepository.findById(
      request.formalizationId,
    )
    if (!formalization) throw new FormalizationNotFoundError()
    const canOperate =
      formalization.assignedLawyerId === request.actorId ||
      request.actorProfile === CollaboratorProfile.Admin
    if (!canOperate) throw new FormalizationSignatureSendingForbiddenError()

    if (formalization.status === 'completed') {
      if (formalization.contractingConfirmationKey !== request.confirmationKey) {
        throw new FormalizationContractingConflictError()
      }
      return this.confirmTransaction(
        formalization.intakeId,
        formalization.id,
        formalization.signatureRequestId ?? '',
        request,
      )
    }
    if (formalization.status !== 'in_progress') {
      throw new FormalizationContractingConflictError()
    }
    if (formalization.version !== request.expectedFormalizationVersion) {
      throw new FormalizationContractingConflictError()
    }

    const signatureRequest = await this.dependencies.requestsRepository.findLatestByFormalizationId(
      formalization.id,
    )
    if (
      !signatureRequest ||
      signatureRequest.version !== request.expectedRequestVersion ||
      signatureRequest.status !== 'confirmed'
    ) {
      throw new FormalizationContractingNotReadyError()
    }
    const documents = await this.dependencies.documentsRepository.listByRequestId(
      signatureRequest.id,
    )
    const recipients = await this.dependencies.recipientsRepository.listByRequestId(
      signatureRequest.id,
    )
    const artifacts = (await this.dependencies.artifactsRepository.findByRequestId(
      signatureRequest.id,
    )) ?? []
    if (!this.areDocumentsReady(documents, artifacts)) {
      throw new FormalizationContractingNotReadyError()
    }
    if (!recipients.length || recipients.some((recipient) => recipient.status !== 'confirmed')) {
      throw new FormalizationContractingNotReadyError()
    }
    for (const recipient of recipients) {
      const protocol = await this.dependencies.protocolsRepository.findByRecipientAndRequest({
        recipientId: recipient.id,
        requestId: signatureRequest.id,
      })
      if (!protocol) throw new FormalizationContractingNotReadyError()
    }

    return this.confirmTransaction(
      formalization.intakeId,
      formalization.id,
      signatureRequest.id,
      request,
    )
  }

  private async confirmTransaction(
    intakeId: string,
    formalizationId: string,
    requestId: string,
    request: Request,
  ): Promise<FormalizationContractingResult> {
    const contractedAt = this.dependencies.datetimeProvider.now()
    const result = await this.dependencies.transaction.confirm({
      formalizationId,
      intakeId,
      requestId,
      expectedFormalizationVersion: request.expectedFormalizationVersion,
      expectedIntakeVersion: request.expectedIntakeVersion,
      expectedRequestVersion: request.expectedRequestVersion,
      actorId: request.actorId,
      confirmationKey: request.confirmationKey,
      contractedAt,
    })
    if (result.outcome === 'conflict') throw new FormalizationContractingConflictError()
    return { ...result.result, duplicate: result.outcome === 'duplicate' }
  }

  private areDocumentsReady(
    documents: Awaited<ReturnType<FormalizationSignatureRequestDocumentsRepository['listByRequestId']>>,
    artifacts: Awaited<ReturnType<FormalizationSignatureArtifactsRepository['findByRequestId']>>,
  ): boolean {
    return Boolean(
      documents.length > 0 &&
        documents.every(
          (document) =>
            document.status === FormalizationSignatureRequestDocumentStatus.confirmed &&
            artifacts.some(
              (artifact) =>
                artifact.requestDocumentId === document.id && artifact.kind === 'signed_pdf',
            ),
        ),
    )
  }
}
