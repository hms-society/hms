import { DocumentVersionStatus } from '../../document-production/domain/structures'
import { ConsultationStatus } from '../domain/structures'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import type { Consultation } from '../domain/entities'
import type { CollaboratorsRepository, UsersRepository } from '#identity/interfaces'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
import type {
  DocumentPackagesRepository,
  PackageDocumentsRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
} from '../../document-production/interfaces'
import type { ConsultationsRepository } from '../interfaces'
import type { ConsultationClientDocument } from '../domain/structures/consultation-client-document'

type Request = {
  clientId: string
  actorId: string
  consultationId: string
  documentId: string
  versionId: string
  forSelection: boolean
}
export class ResolveConsultationClientDocumentUseCase {
  constructor(
    private readonly consultations: ConsultationsRepository,
    private readonly packages: DocumentPackagesRepository,
    private readonly packageDocuments: PackageDocumentsRepository,
    private readonly documents: DocumentsRepository,
    private readonly versions: DocumentVersionsRepository,
    private readonly collaborators: CollaboratorsRepository,
    private readonly users: UsersRepository,
  ) {}
  async execute(request: Request): Promise<ConsultationClientDocument> {
    const consultation = await this.requireAuthorizedConsultation(request)
    if (request.forSelection && consultation.status !== ConsultationStatus.Completed)
      throw new NotFoundError('Documento indisponível.')
    await this.requireIncludedDocument(request)
    const { document, version } = await this.requireApprovedVersion(request)
    return {
      consultationId: consultation.id,
      clientId: consultation.clientId,
      documentId: document.id,
      versionId: version.id,
      name: document.title,
      fileId: version.fileId,
      storagePath: version.storagePath,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      createdAt: version.createdAt,
    }
  }
  private async requireAuthorizedConsultation(request: Request): Promise<Consultation> {
    const consultation = await this.consultations.findById(request.consultationId)
    const actor = await this.collaborators.findById(request.actorId)
    const user = actor ? await this.users.findById(actor.userId) : undefined
    if (
      !consultation ||
      consultation.clientId !== request.clientId ||
      actor?.profile !== CollaboratorProfile.Lawyer ||
      consultation.assignedLawyerId !== actor.id ||
      user?.status !== UserStatus.Active
    )
      throw new ForbiddenError('Acesso ao documento de Consulta não autorizado.')
    if (request.forSelection && !consultation.completedAt)
      throw new NotFoundError('Documento indisponível.')
    return consultation
  }
  private async requireIncludedDocument(request: Request): Promise<void> {
    const documentPackage = await this.packages.findByContext({
      type: 'consultation',
      consultationId: request.consultationId,
    })
    if (!documentPackage) throw new NotFoundError('Documento indisponível.')
    const included = await this.packageDocuments.findByDocumentPackageId(
      documentPackage.id,
    )
    if (!included.some((item) => item.documentId === request.documentId))
      throw new NotFoundError('Documento indisponível.')
  }
  private async requireApprovedVersion(request: Request) {
    const document = await this.documents.findById(request.documentId)
    const version = await this.versions.findById(request.versionId)
    if (
      !document ||
      !version ||
      version.documentId !== document.id ||
      version.status !== DocumentVersionStatus.Approved
    )
      throw new NotFoundError('Documento indisponível.')
    if (request.forSelection && document.currentVersionId !== version.id)
      throw new NotFoundError('Documento indisponível.')
    return { document, version }
  }
}
