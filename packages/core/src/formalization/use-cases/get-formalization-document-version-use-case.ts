import type { DocumentVersion } from '../../document-production/domain/entities'
import type {
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import type { UseCase } from '../../shared/interfaces'
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
}

export class GetFormalizationDocumentVersionUseCase
  implements UseCase<Request, DocumentVersion>
{
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly versionsRepository: DocumentVersionsRepository,
  ) {}

  async execute(request: Request): Promise<DocumentVersion> {
    const formalization = await this.formalizationsRepository.findById(
      request.formalizationId,
    )
    if (!formalization) throw new FormalizationNotFoundError()
    FormalizationActorAuthorization.assertAccess(formalization.assignedLawyerId, request)
    FormalizationDocumentGuard.assertFormClosed(formalization)
    const version = await this.versionsRepository.findById(request.versionId)
    if (!version)
      throw new FormalizationStateConflictError('A versão documental não foi encontrada.')
    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'formalization',
      formalizationId: formalization.id,
    })
    if (!documentPackage)
      throw new FormalizationStateConflictError(
        'O documento não pertence à formalização.',
      )
    const packageDocuments =
      await this.packageDocumentsRepository.findByDocumentPackageId(documentPackage.id)
    if (
      !packageDocuments.some((document) => document.documentId === version.documentId)
    ) {
      throw new FormalizationStateConflictError(
        'A versão documental não pertence à formalização.',
      )
    }
    return version
  }
}
