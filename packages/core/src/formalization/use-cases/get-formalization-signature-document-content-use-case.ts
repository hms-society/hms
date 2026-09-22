import type { StoredFileContent } from '../../shared/domain/structures'
import type { FileStorageProvider } from '../../shared/interfaces'
import {
  FormalizationNotFoundError,
  FormalizationSignatureDocumentVersionFileUnavailableError,
  FormalizationSignatureNotReadyError,
} from '../domain/errors'
import {
  FormalizationSignatureDocumentContentKind,
  FormalizationSignatureRequestDocumentStatus,
  FormalizationSignatureRequestStatus,
} from '../domain/structures'
import type {
  FormalizationActor,
  FormalizationSignatureDocumentContentKind as DocumentContentKind,
} from '../domain/structures'
import type {
  FormalizationsRepository,
  FormalizationSignatureArtifactsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
} from '../interfaces'
import { FormalizationUseCase } from './formalization-use-case'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly requestDocumentId: string
  readonly contentKind: DocumentContentKind
}

type Dependencies = {
  readonly formalizationsRepository: FormalizationsRepository
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly documentsRepository: FormalizationSignatureRequestDocumentsRepository
  readonly artifactsRepository: FormalizationSignatureArtifactsRepository
  readonly fileStorageProvider: FileStorageProvider
}

export class GetFormalizationSignatureDocumentContentUseCase extends FormalizationUseCase<
  Request,
  StoredFileContent
> {
  constructor(private readonly dependencies: Dependencies) {
    super()
  }

  async execute(request: Request): Promise<StoredFileContent> {
    const formalization = await this.dependencies.formalizationsRepository.findById(
      request.formalizationId,
    )

    if (!formalization) throw new FormalizationNotFoundError()
    this.assertAccess(formalization.assignedLawyerId, request)

    const signatureRequest =
      await this.dependencies.requestsRepository.findLatestByFormalizationId(
        formalization.id,
      )
    if (
      !signatureRequest ||
      signatureRequest.status !== FormalizationSignatureRequestStatus.confirmed
    ) {
      throw new FormalizationSignatureNotReadyError(
        'Os documentos ficam disponíveis depois que todas as assinaturas são confirmadas.',
      )
    }

    const document = await this.dependencies.documentsRepository.findById(
      request.requestDocumentId,
    )
    if (
      !document ||
      document.requestId !== signatureRequest.id ||
      document.status !== FormalizationSignatureRequestDocumentStatus.confirmed
    ) {
      throw new FormalizationSignatureDocumentVersionFileUnavailableError()
    }

    const privateFileId = await this.getPrivateFileId(
      document.id,
      document.unsignedPrivateFileId,
      request.contentKind,
    )
    const storedFile = await this.dependencies.fileStorageProvider.get(privateFileId)

    if (!storedFile) throw new FormalizationSignatureDocumentVersionFileUnavailableError()
    return storedFile
  }

  private async getPrivateFileId(
    requestDocumentId: string,
    originalPrivateFileId: string,
    contentKind: DocumentContentKind,
  ) {
    if (contentKind === FormalizationSignatureDocumentContentKind.original) {
      return originalPrivateFileId
    }

    const artifacts =
      await this.dependencies.artifactsRepository.findByRequestDocumentId(
        requestDocumentId,
      )
    const signedArtifact = artifacts.find((artifact) => artifact.kind === 'signed_pdf')

    if (!signedArtifact)
      throw new FormalizationSignatureDocumentVersionFileUnavailableError(
        'O documento assinado não está disponível.',
      )
    return signedArtifact.privateFileId
  }
}
