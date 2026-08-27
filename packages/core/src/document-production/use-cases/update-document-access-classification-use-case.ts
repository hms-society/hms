import type { ClassificacaoAcesso } from '../domain/entities/document'
import type { DocumentsRepository } from '../interfaces/documents-repository'
import type { PackageDocumentsRepository } from '../interfaces/package-documents-repository'
import type { DocumentPackagesRepository } from '../interfaces/document-packages-repository'
import type { ConsultationsRepository } from '../../consultation/interfaces/consultations-repository'
import type { CollaboratorProfile as CollaboratorProfileValue } from '../../identity/domain/structures/collaborator-profile'
import { CollaboratorProfile } from '../../identity/domain/structures/collaborator-profile'

export interface UpdateDocumentAccessClassificationRequest {
  documentId: string
  userId: string
  collaboratorId: string
  collaboratorProfile: CollaboratorProfileValue
  newClassification: ClassificacaoAcesso
}

export interface UpdateDocumentAccessClassificationResponse {
  success: boolean
}

export class UpdateDocumentAccessClassificationUseCase {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly consultationsRepository: ConsultationsRepository,
  ) {}

  async execute(
    request: UpdateDocumentAccessClassificationRequest,
  ): Promise<UpdateDocumentAccessClassificationResponse> {
    const { documentId, userId, collaboratorId, collaboratorProfile, newClassification } =
      request

    const document = await this.documentsRepository.findById(documentId)
    if (!document) {
      throw new Error('Documento não encontrado.')
    }

    // Authorization Check
    const packageDocs =
      await this.packageDocumentsRepository.findAllByDocumentId(documentId)
    if (packageDocs.length === 0) {
      throw new Error('Documento não está vinculado a um pacote.')
    }

    let hasAccess = true
    for (const packageDoc of packageDocs) {
      const docPackage = await this.documentPackagesRepository.findById(
        packageDoc.documentPackageId,
      )
      if (!docPackage) {
        throw new Error('Pacote de documentos não encontrado.')
      }

      if (docPackage.context.type === 'consultation') {
        const consultation = await this.consultationsRepository.findById(
          docPackage.context.consultationId,
        )
        if (consultation?.assignedLawyerId !== collaboratorId) {
          hasAccess = false
          break
        }
      } else if (docPackage.context.type === 'formalization') {
        throw new Error('Acesso a documentos de formalização ainda não foi implementado.')
      } else {
        throw new Error(
          `Acesso a documentos do contexto '${docPackage.context.type}' não suportado.`,
        )
      }
    }

    if (!hasAccess && collaboratorProfile !== CollaboratorProfile.Admin) {
      throw new Error(
        'Acesso negado: apenas o advogado responsável ou um administrador pode alterar a classificação de acesso deste documento.',
      )
    }

    await this.documentsRepository.updateClassificationWithAudit({
      documentId,
      userId,
      valorNovo: newClassification,
    })

    return { success: true }
  }
}
