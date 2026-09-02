import type { DatetimeProvider, UseCase } from '../../shared/interfaces'
import type { DocumentVersion } from '../../document-production/domain/entities'
import type {
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import type { DocumentVersionStatus } from '../../document-production/domain/structures'
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
  readonly versionId: string
  readonly status: Extract<DocumentVersionStatus, 'approved' | 'rejected'>
  readonly rejectionReason?: string
}

export class ReviewFormalizationDocumentVersionUseCase
  implements UseCase<Request, DocumentVersion>
{
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly versionsRepository: DocumentVersionsRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<DocumentVersion> {
    const formalization = await this.formalizationsRepository.findById(
      request.formalizationId,
    )
    if (!formalization) throw new FormalizationNotFoundError()
    FormalizationActorAuthorization.assertAccess(formalization.assignedLawyerId, request)
    FormalizationDocumentGuard.assertWritable(formalization)
    if (formalization.documentsConfirmedAt) {
      throw new FormalizationStateConflictError(
        'Reabra a confirmação antes de revisar documentos.',
      )
    }
    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'formalization',
      formalizationId: formalization.id,
    })
    if (!documentPackage)
      throw new FormalizationStateConflictError('A versão não pertence à formalização.')
    const packageDocuments =
      await this.packageDocumentsRepository.findByDocumentPackageId(documentPackage.id)
    const version = await this.versionsRepository.findById(request.versionId)
    if (
      !version ||
      !packageDocuments.some((document) => document.documentId === version.documentId)
    ) {
      throw new FormalizationStateConflictError('A versão não pertence à formalização.')
    }
    const rejectionReason = request.rejectionReason?.trim()
    if (request.status === 'rejected' && !rejectionReason) {
      throw new FormalizationStateConflictError('Informe o motivo da rejeição.')
    }
    const reviewed = await this.versionsRepository.review(
      version.id,
      request.status,
      request.actorId,
      this.datetimeProvider.now(),
      rejectionReason,
    )
    if (!reviewed) throw new FormalizationStateConflictError('A versão já foi revisada.')
    return reviewed
  }
}
