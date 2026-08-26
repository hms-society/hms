import type { ClassificacaoAcesso } from '../domain/entities/document'
import type { DocumentsRepository } from '../interfaces/documents-repository'

export interface UpdateDocumentAccessClassificationRequest {
  documentId: string
  userId: string
  newClassification: ClassificacaoAcesso
  destinatarioIdentificador?: string
}

export interface UpdateDocumentAccessClassificationResponse {
  success: boolean
}

export class UpdateDocumentAccessClassificationUseCase {
  constructor(private readonly documentsRepository: DocumentsRepository) {}

  async execute(
    request: UpdateDocumentAccessClassificationRequest,
  ): Promise<UpdateDocumentAccessClassificationResponse> {
    const { documentId, userId, newClassification, destinatarioIdentificador } = request

    if (newClassification === 'PARCEIRO_LIBERADO' && !destinatarioIdentificador) {
      throw new Error(
        'A seleção do parceiro destinatário é obrigatória para a classificação PARCEIRO_LIBERADO.',
      )
    }

    const document = await this.documentsRepository.findById(documentId)
    if (!document) {
      throw new Error('Documento não encontrado.')
    }

    const valorAnterior = document.classificacaoAcesso

    await this.documentsRepository.updateClassificationWithAudit({
      documentId,
      userId,
      valorAnterior,
      valorNovo: newClassification,
      destinatarioIdentificador,
    })

    return { success: true }
  }
}
