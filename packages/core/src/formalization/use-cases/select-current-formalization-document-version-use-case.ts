import type { UseCase } from '../../shared/interfaces'
import type { DocumentVersion } from '../../document-production/domain/entities'
import { DocumentVersionNotApprovedError } from '../../document-production/domain/errors'
import type {
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import {
  FormalizationNotFoundError,
  FormalizationStateConflictError,
} from '../domain/errors'
import type { FormalizationActor } from '../domain/structures'
import type { FormalizationsRepository } from '../interfaces'
import { FormalizationActorAuthorization } from './formalization-actor-authorization'
import { FormalizationDocumentGuard } from './formalization-document-guard'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly documentId: string
  readonly versionId: string
}

export class SelectCurrentFormalizationDocumentVersionUseCase
  implements UseCase<Request, DocumentVersion>
{
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly documentsRepository: DocumentsRepository,
    private readonly versionsRepository: DocumentVersionsRepository,
  ) {}

  async execute(request: Request): Promise<DocumentVersion> {
    const formalization = await this.formalizationsRepository.findById(request.formalizationId)
    if (!formalization) throw new FormalizationNotFoundError()
    FormalizationActorAuthorization.assertAccess(formalization.assignedLawyerId, request)
    FormalizationDocumentGuard.assertWritable(formalization)
    if (formalization.documentsConfirmedAt) {
      throw new FormalizationStateConflictError('Reabra a confirmação antes de alterar a versão vigente.')
    }
    const version = await this.versionsRepository.findById(request.versionId)
    if (!version || version.documentId !== request.documentId) {
      throw new FormalizationStateConflictError('A versão não pertence ao documento.')
    }
    if (version.status !== 'approved') throw new DocumentVersionNotApprovedError()
    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'formalization',
      formalizationId: formalization.id,
    })
    if (!documentPackage) throw new FormalizationStateConflictError('O documento não pertence à formalização.')
    const packageDocuments = await this.packageDocumentsRepository.findByDocumentPackageId(
      documentPackage.id,
    )
    if (!packageDocuments.some((document) => document.documentId === request.documentId)) {
      throw new FormalizationStateConflictError('O documento não pertence à formalização.')
    }
    const selected = await this.documentsRepository.replace(request.documentId, {
      currentVersionId: request.versionId,
    })
    if (!selected) throw new FormalizationStateConflictError('O documento não foi encontrado.')
    return version
  }
}
