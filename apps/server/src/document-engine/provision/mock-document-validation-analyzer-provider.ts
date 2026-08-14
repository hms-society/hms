import { Injectable } from '@nestjs/common'
import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'
import type {
  DocumentValidationAnalysis,
  DocumentValidationAnalyzerProvider,
} from '@hms/core/document-engine/interfaces'

const EXTRACTED_FIELDS = [
  { label: 'Titular', value: 'Mariana Costa Silva', confidence: 94, isRequired: true },
  { label: 'CPF', value: '284.***.***-19', confidence: 91, isRequired: true },
  {
    label: 'Endereço',
    value: 'Rua das Palmeiras, 147',
    confidence: 89,
    isRequired: true,
  },
  { label: 'CEP', value: '01452-001', confidence: 88, isRequired: true },
  {
    label: 'Data de emissão',
    value: '04/08/2026',
    confidence: 83,
    isRequired: true,
  },
]

@Injectable()
export class MockDocumentValidationAnalyzerProvider
  implements DocumentValidationAnalyzerProvider
{
  async analyze(
    document: DocumentValidationDocument,
  ): Promise<DocumentValidationAnalysis> {
    const fileName = document.fileName.toLowerCase()

    if (fileName.includes('declaracao') || fileName.includes('duplic')) {
      return this.duplicateAnalysis(document)
    }

    if (fileName.includes('rg') || fileName.includes('identidade')) {
      return this.illegibleAnalysis()
    }

    if (fileName.includes('contrato') || fileName.includes('balanco')) {
      return this.incompleteAnalysis()
    }

    if (fileName.includes('procuracao') || fileName.includes('extrato')) {
      return this.processingFailureAnalysis()
    }

    return this.validAnalysis()
  }

  private validAnalysis(): DocumentValidationAnalysis {
    return {
      status: DocumentValidationStatus.Valid,
      aiConfidence: 96,
      extractedFields: EXTRACTED_FIELDS,
      missingFields: [],
      aiSuggestion: {
        confidenceLabel: 'Sugerido pela IA - Confiança alta',
        documentTypeId: 'comprovante_residencia',
        caseLabel: 'Caso 0089',
        checklistItemLabel: 'Comprovante de residência',
      },
    }
  }

  private incompleteAnalysis(): DocumentValidationAnalysis {
    return {
      status: DocumentValidationStatus.Incomplete,
      aiConfidence: 78,
      extractedFields: EXTRACTED_FIELDS.slice(0, 4),
      missingFields: ['Data de emissão'],
      aiSuggestion: {
        confidenceLabel: 'Sugerido pela IA',
        documentTypeId: 'comprovante_residencia',
        caseLabel: 'Caso 0089',
        checklistItemLabel: 'Comprovante de residência',
      },
    }
  }

  private illegibleAnalysis(): DocumentValidationAnalysis {
    return {
      status: DocumentValidationStatus.Illegible,
      aiConfidence: 31,
      extractedFields: [],
      missingFields: ['Titular', 'CPF', 'Endereço', 'CEP', 'Data de emissão'],
      aiSuggestion: { confidenceLabel: 'Baixa confiança' },
    }
  }

  private duplicateAnalysis(
    document: DocumentValidationDocument,
  ): DocumentValidationAnalysis {
    return {
      status: DocumentValidationStatus.Duplicate,
      aiConfidence: 92,
      originalDocumentId: document.id,
      extractedFields: EXTRACTED_FIELDS,
      missingFields: [],
      aiSuggestion: {
        confidenceLabel: 'Sugerido pela IA',
        documentTypeId: 'comprovante_residencia',
        caseLabel: 'Caso 0089',
        checklistItemLabel: 'Comprovante de residência',
        originalDocumentFileName: 'comprovante-residencia.pdf',
      },
    }
  }

  private processingFailureAnalysis(): DocumentValidationAnalysis {
    return {
      status: DocumentValidationStatus.ProcessingFailure,
      aiConfidence: 0,
      extractedFields: [],
      missingFields: [],
      aiSuggestion: {
        confidenceLabel: 'Falha no processamento',
        failureReason: 'Arquivo protegido por senha',
        failureInstruction:
          'Solicite ao remetente uma nova cópia do arquivo sem proteção por senha.',
      },
    }
  }
}
