import type { UseCase } from '#shared/interfaces/use-case'
import type { CaseMembersRepository } from '../../case-management/interfaces'
import { ForbiddenError, NotFoundError } from '../../shared/domain/errors'

import type { DocumentVersion } from '../domain/entities'
import type {
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../interfaces'

type Request = {
  readonly caseId: string
  readonly documentId: string
  readonly documentVersionId: string
  readonly collaboratorId: string
}

export class SubmitDocumentVersionForReviewUseCase
  implements UseCase<Request, DocumentVersion>
{
  constructor(
    private readonly versionsRepository: DocumentVersionsRepository,
    private readonly packagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly caseMembersRepository: CaseMembersRepository,
  ) {}

  async execute(request: Request): Promise<DocumentVersion> {
    await this.ensureCaseDocumentAccess(request)
    const currentVersion = await this.versionsRepository.findById(
      request.documentVersionId,
    )
    if (!currentVersion) {
      throw new Error('A versão documental não está disponível para envio.')
    }
    if (currentVersion.documentId !== request.documentId) {
      throw new NotFoundError('A versão documental não foi encontrada no caso.')
    }

    const version = await this.versionsRepository.submitForReview(
      request.documentVersionId,
      request.collaboratorId,
    )
    if (!version) {
      throw new Error('A versão documental não está disponível para envio.')
    }
    return version
  }

  private async ensureCaseDocumentAccess(request: Request): Promise<void> {
    const activeCollaboratorIds =
      await this.caseMembersRepository.findActiveCollaboratorIdsByCaseId(request.caseId, [
        request.collaboratorId,
      ])
    if (!activeCollaboratorIds.includes(request.collaboratorId)) {
      throw new ForbiddenError('Somente membros ativos do caso podem enviar documentos.')
    }

    const documentPackage = await this.packagesRepository.findByContext({
      type: 'case',
      caseId: request.caseId,
    })
    if (!documentPackage) {
      throw new NotFoundError('O documento não foi encontrado no caso.')
    }

    const packageDocuments =
      await this.packageDocumentsRepository.findByDocumentPackageId(documentPackage.id)
    if (!packageDocuments.some(({ documentId }) => documentId === request.documentId)) {
      throw new NotFoundError('O documento não foi encontrado no caso.')
    }
  }
}
