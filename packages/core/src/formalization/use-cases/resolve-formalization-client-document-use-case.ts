import {
  FormalizationSignatureArtifactKind,
  FormalizationSignatureRequestStatus,
  FormalizationSignatureRequestDocumentStatus,
} from '../domain/structures'
import { FormalizationStatus } from '../domain/structures'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import type { Formalization, FormalizationSignatureArtifact } from '../domain/entities'
import type { CollaboratorsRepository, UsersRepository } from '#identity/interfaces'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
import type { DocumentsRepository } from '../../document-production/interfaces'
import type {
  FormalizationsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureArtifactsRepository,
} from '../interfaces'
import type { FormalizationClientDocument } from '../domain/structures/formalization-client-document'
type Request = {
  clientId: string
  actorId: string
  formalizationId: string
  requestDocumentId: string
  artifactId: string
  forSelection: boolean
}
export class ResolveFormalizationClientDocumentUseCase {
  constructor(
    private readonly formalizations: FormalizationsRepository,
    private readonly requests: FormalizationSignatureRequestsRepository,
    private readonly requestDocuments: FormalizationSignatureRequestDocumentsRepository,
    private readonly artifacts: FormalizationSignatureArtifactsRepository,
    private readonly documents: DocumentsRepository,
    private readonly collaborators: CollaboratorsRepository,
    private readonly users: UsersRepository,
  ) {}
  async execute(input: Request): Promise<FormalizationClientDocument> {
    const formalization = await this.requireAuthorizedFormalization(input)
    const artifact = await this.requirePreservedArtifact(input.artifactId)
    const requestDocument = await this.requireConfirmedLink(
      formalization,
      artifact,
      input,
    )
    const document = await this.documents.findById(requestDocument.sourceDocumentId)
    if (!document) throw new NotFoundError('Documento assinado indisponível.')
    return {
      formalizationId: formalization.id,
      clientId: formalization.clientId,
      documentId: document.id,
      requestDocumentId: requestDocument.id,
      artifactId: artifact.id,
      privateFileId: artifact.privateFileId,
      name: document.title,
      mimeType: artifact.mediaType,
      sizeBytes: artifact.byteCount,
      createdAt: artifact.preservedAt,
    }
  }
  private async requireAuthorizedFormalization(input: Request): Promise<Formalization> {
    const formalization = await this.formalizations.findById(input.formalizationId)
    const actor = await this.collaborators.findById(input.actorId)
    const user = actor ? await this.users.findById(actor.userId) : undefined
    const canReadFormalization =
      actor?.profile === CollaboratorProfile.Admin ||
      (actor?.profile === CollaboratorProfile.Lawyer &&
        formalization?.assignedLawyerId === actor.id)
    if (
      !formalization ||
      formalization.clientId !== input.clientId ||
      !canReadFormalization ||
      user?.status !== UserStatus.Active
    )
      throw new ForbiddenError('Acesso ao documento de Formalização não autorizado.')
    if (
      input.forSelection &&
      (formalization.status !== FormalizationStatus.Completed ||
        !formalization.completedAt)
    )
      throw new NotFoundError('Documento assinado indisponível.')
    return formalization
  }
  private async requirePreservedArtifact(
    artifactId: string,
  ): Promise<FormalizationSignatureArtifact> {
    const artifact = await this.artifacts.findById(artifactId)
    if (
      !artifact ||
      artifact.kind !== FormalizationSignatureArtifactKind.signedPdf ||
      artifact.mediaType !== 'application/pdf' ||
      !artifact.preservedAt ||
      !artifact.privateFileId
    )
      throw new NotFoundError('Documento assinado indisponível.')
    return artifact
  }
  private async requireConfirmedLink(
    formalization: Formalization,
    artifact: FormalizationSignatureArtifact,
    input: Request,
  ) {
    const requestDocument = await this.requestDocuments.findById(input.requestDocumentId)
    const request = await this.requests.findById(artifact.requestId)
    if (
      !requestDocument ||
      !request ||
      request.formalizationId !== formalization.id ||
      artifact.requestDocumentId !== requestDocument.id ||
      requestDocument.requestId !== request.id
    )
      throw new NotFoundError('Documento assinado indisponível.')
    if (
      request.status !== FormalizationSignatureRequestStatus.confirmed ||
      requestDocument.status !== FormalizationSignatureRequestDocumentStatus.confirmed ||
      !requestDocument.confirmedAt
    )
      throw new NotFoundError('Documento assinado indisponível.')
    if (input.forSelection && formalization.signatureRequestId !== request.id)
      throw new NotFoundError('Documento assinado indisponível.')
    return requestDocument
  }
}
