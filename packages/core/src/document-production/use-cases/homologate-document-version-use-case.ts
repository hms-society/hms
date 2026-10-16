import type {
  CaseMembersRepository,
  LegalCasesRepository,
} from '../../case-management/interfaces'
import type { CollaboratorProfile } from '../../identity/domain/structures'
import { ForbiddenError, NotFoundError } from '../../shared/domain/errors'
import {
  DocumentVersionHomologationConflictError,
  DocumentVersionHomologationNotReadyError,
} from '../domain/errors'
import type { DocumentVersionHomologation } from '../domain/entities'
import type {
  DocumentPackagesRepository,
  DocumentVersionHomologationsRepository,
  DocumentVersionsRepository,
} from '../interfaces'

type Request = {
  caseId: string
  documentId: string
  documentVersionId: string
  approvedByCollaboratorId: string
  approvedByCollaboratorName: string
  approvedByCollaboratorProfile: CollaboratorProfile
  approvedAt: Date
}

export class HomologateDocumentVersionUseCase {
  constructor(
    private readonly versionsRepository: DocumentVersionsRepository,
    private readonly homologationsRepository: DocumentVersionHomologationsRepository,
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly caseMembersRepository: CaseMembersRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
  ) {}

  async execute(request: Request): Promise<DocumentVersionHomologation> {
    const version = await this.versionsRepository.findById(request.documentVersionId)
    if (!version || version.documentId !== request.documentId) {
      throw new NotFoundError('A versão documental não foi encontrada.')
    }
    if (version.status !== 'approved' || version.pendingMarkers.length > 0) {
      throw new DocumentVersionHomologationNotReadyError()
    }
    if (await this.homologationsRepository.findByDocumentVersionId(version.id)) {
      throw new DocumentVersionHomologationConflictError()
    }

    const isPrivileged =
      request.approvedByCollaboratorProfile === 'admin' ||
      request.approvedByCollaboratorProfile === 'supervisor'
    const legalCase = await this.legalCasesRepository.findById(request.caseId)
    if (!legalCase) {
      throw new NotFoundError('O caso jurídico não foi encontrado.')
    }
    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'case',
      caseId: request.caseId,
    })
    if (
      !documentPackage?.documents.some(
        (document) => document.documentId === request.documentId,
      )
    ) {
      throw new NotFoundError('O documento não foi encontrado no caso.')
    }
    const isCaseMember = (
      await this.caseMembersRepository.findActiveCollaboratorIdsByCaseId(request.caseId, [
        request.approvedByCollaboratorId,
      ])
    ).includes(request.approvedByCollaboratorId)
    if (!isPrivileged && !isCaseMember) {
      throw new ForbiddenError(
        'Somente responsáveis autorizados pelo caso podem homologar a versão.',
      )
    }

    return this.homologationsRepository.add({
      caseId: request.caseId,
      documentId: request.documentId,
      documentVersionId: request.documentVersionId,
      approvedByCollaboratorId: request.approvedByCollaboratorId,
      approvedByCollaboratorName: request.approvedByCollaboratorName,
      approvedByCollaboratorProfile: request.approvedByCollaboratorProfile,
      approvedAt: request.approvedAt,
    })
  }
}
