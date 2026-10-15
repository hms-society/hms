import { ConsultationStatus } from '../domain/structures'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
import type { ConsultationsRepository } from '../interfaces'
import type {
  DocumentPackagesRepository,
  PackageDocumentsRepository,
  DocumentsRepository,
} from '../../document-production/interfaces'
import type { CollaboratorsRepository, UsersRepository } from '#identity/interfaces'
import type { ResolveConsultationClientDocumentUseCase } from './resolve-consultation-client-document-use-case'
import type { ConsultationClientDocument } from '../domain/structures/consultation-client-document'
export class ListConsultationClientDocumentsUseCase {
  constructor(
    private readonly consultations: ConsultationsRepository,
    private readonly packages: DocumentPackagesRepository,
    private readonly packageDocuments: PackageDocumentsRepository,
    private readonly documents: DocumentsRepository,
    private readonly collaborators: CollaboratorsRepository,
    private readonly users: UsersRepository,
    private readonly resolve: ResolveConsultationClientDocumentUseCase,
  ) {}
  async execute(request: {
    clientId: string
    actorId: string
  }): Promise<readonly ConsultationClientDocument[]> {
    const actor = await this.collaborators.findById(request.actorId)
    if (
      actor?.profile !== CollaboratorProfile.Lawyer ||
      (await this.users.findById(actor.userId))?.status !== UserStatus.Active
    )
      return []
    const results: ConsultationClientDocument[] = []
    for (const consultation of await this.consultations.findByClientId(
      request.clientId,
    )) {
      if (
        consultation.assignedLawyerId !== actor.id ||
        consultation.status !== ConsultationStatus.Completed ||
        !consultation.completedAt
      )
        continue
      const documentPackage = await this.packages.findByContext({
        type: 'consultation',
        consultationId: consultation.id,
      })
      if (!documentPackage) continue
      results.push(
        ...(await this.listReadablePackageDocuments(
          request,
          consultation.id,
          documentPackage.id,
        )),
      )
    }
    return results
  }
  private async listReadablePackageDocuments(
    request: { clientId: string; actorId: string },
    consultationId: string,
    documentPackageId: string,
  ): Promise<ConsultationClientDocument[]> {
    const results: ConsultationClientDocument[] = []
    for (const included of await this.packageDocuments.findByDocumentPackageId(
      documentPackageId,
    )) {
      const document = await this.documents.findById(included.documentId)
      if (!document?.currentVersionId) continue
      const source = await this.resolveReadable({
        ...request,
        consultationId,
        documentId: document.id,
        versionId: document.currentVersionId,
        forSelection: true,
      })
      if (source) results.push(source)
    }
    return results
  }
  private async resolveReadable(
    request: Parameters<ResolveConsultationClientDocumentUseCase['execute']>[0],
  ) {
    try {
      return await this.resolve.execute(request)
    } catch (error) {
      if (!(error instanceof ForbiddenError) && !(error instanceof NotFoundError))
        throw error
      return undefined
    }
  }
}
