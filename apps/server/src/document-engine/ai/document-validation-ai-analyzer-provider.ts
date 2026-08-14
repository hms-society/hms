import { Injectable } from '@nestjs/common'
import { z } from 'zod'
import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'
import type {
  DocumentValidationAnalysis,
  DocumentValidationAnalyzerProvider,
} from '@hms/core/document-engine/interfaces'

import { EnvProvider } from '@/shared/provision/env/env-provider'
import {
  createDocumentValidationAiInput,
  DOCUMENT_VALIDATION_REQUIRED_FIELDS,
} from './create-document-validation-ai-input'
import { DocumentValidationAgent } from './mastra/agents'

const DOCUMENT_VALIDATION_REQUIRED_FIELDS_SET = new Set<string>(
  DOCUMENT_VALIDATION_REQUIRED_FIELDS,
)

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

const documentValidationAnalysisSchema = z.object({
  status: z.enum(DocumentValidationStatus),
  aiConfidence: z.number().min(0).max(100).optional(),
  aiSuggestion: z.record(z.string(), z.unknown()).optional(),
  extractedFields: z.array(
    z
      .record(z.string(), z.unknown())
      .and(z.object({ label: z.string(), value: z.string().optional() })),
  ),
  missingFields: z.array(z.string()),
  caseId: z.string().optional(),
  checklistItemId: z.string().optional(),
  originalDocumentId: z.string().optional(),
})

const ollamaChatResponseSchema = z.object({
  message: z.object({
    content: z.string(),
  }),
})

type NativeOllamaAnalysisResult =
  | { analysis: DocumentValidationAnalysis; failureReason?: never }
  | { analysis?: never; failureReason: string }

@Injectable()
export class DocumentValidationAiAnalyzerProvider
  implements DocumentValidationAnalyzerProvider
{
  constructor(
    private readonly documentValidationAgent: DocumentValidationAgent,
    private readonly envProvider: EnvProvider,
  ) {}

  async analyze(
    document: DocumentValidationDocument,
  ): Promise<DocumentValidationAnalysis> {
    if (!this.shouldUseLiveAgent()) {
      return this.deterministicAnalysis(document)
    }

    try {
      const response = await this.runLiveAgent(document)

      if (!response.object) {
        return this.processingFailureAnalysis({
          provider: 'mastra-document-validation-agent',
          failureReason: 'A IA não retornou uma resposta estruturada válida.',
          failureInstruction:
            'Verifique o prompt, o schema de saída e o modelo configurado.',
        })
      }

      const normalizedAnalysis = this.normalizeLiveAnalysis(response.object)

      return {
        ...normalizedAnalysis,
        aiSuggestion: {
          provider: 'mastra-document-validation-agent',
          model:
            this.envProvider.get('HMS_SERVER_APP_MODE') === 'dev'
              ? this.envProvider.get('OLLAMA_AI_MODEL')
              : 'deepseek/deepseek-v4-flash',
          ...(normalizedAnalysis.aiSuggestion ?? {}),
        },
      }
    } catch (error) {
      const nativeOllamaAnalysis = await this.tryNativeOllamaAnalysis(document, error)

      if (nativeOllamaAnalysis.analysis) {
        return nativeOllamaAnalysis.analysis
      }

      return this.processingFailureAnalysis({
        provider: 'mastra-document-validation-agent',
        failureReason:
          nativeOllamaAnalysis.failureReason ?? this.resolveLiveAgentFailureReason(error),
        failureInstruction:
          'Verifique se o Ollama está rodando, se OLLAMA_AI_MODEL existe localmente e se DOCUMENT_VALIDATION_AI_MODE deve continuar como live. Para validação rápida do PR, use DOCUMENT_VALIDATION_AI_MODE=deterministic.',
      })
    }
  }

  private shouldUseLiveAgent() {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      return false
    }

    if (this.envProvider.get('DOCUMENT_VALIDATION_AI_MODE') !== 'live') {
      return false
    }

    if (this.envProvider.get('HMS_SERVER_APP_MODE') === 'dev') {
      return Boolean(this.envProvider.get('OLLAMA_AI_MODEL'))
    }

    return Boolean(this.envProvider.get('OPENROUTER_API_KEY'))
  }

  private runLiveAgent(document: DocumentValidationDocument) {
    return this.documentValidationAgent.generate(
      JSON.stringify(createDocumentValidationAiInput(document)),
      {
        structuredOutput: { schema: documentValidationAnalysisSchema },
      },
    )
  }

  private async tryNativeOllamaAnalysis(
    document: DocumentValidationDocument,
    originalError: unknown,
  ): Promise<NativeOllamaAnalysisResult> {
    if (this.envProvider.get('HMS_SERVER_APP_MODE') !== 'dev') {
      return { failureReason: this.resolveLiveAgentFailureReason(originalError) }
    }

    const model = this.envProvider.get('OLLAMA_AI_MODEL')
    if (!model) {
      return {
        failureReason:
          'O modo live local exige OLLAMA_AI_MODEL configurado no ambiente.',
      }
    }

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          format: 'json',
          messages: [
            {
              role: 'system',
              content:
                'Return only valid JSON. Do not include markdown. Use only the requested keys.',
            },
            {
              role: 'user',
              content: this.createNativeOllamaPrompt(document),
            },
          ],
          options: {
            temperature: 0,
            num_predict: 220,
          },
        }),
      })

      if (!response.ok) {
        return {
          failureReason: `A chamada nativa ao Ollama falhou com HTTP ${response.status}.`,
        }
      }

      const chatResponse = ollamaChatResponseSchema.parse(await response.json())
      const parsedAnalysis = this.parseNativeOllamaAnalysis(
        chatResponse.message.content,
      )
      const normalizedAnalysis = this.normalizeLiveAnalysis(parsedAnalysis)

      return {
        analysis: {
          ...normalizedAnalysis,
          aiSuggestion: {
            provider: 'ollama-native-document-validation-fallback',
            model,
            mastraFailureReason: this.resolveLiveAgentFailureReason(originalError),
            ...(normalizedAnalysis.aiSuggestion ?? {}),
          },
        },
      }
    } catch (error) {
      return {
        failureReason: `${this.resolveLiveAgentFailureReason(originalError)}. A chamada nativa ao Ollama também falhou: ${this.resolveLiveAgentFailureReason(error)}`,
      }
    }
  }

  private parseNativeOllamaAnalysis(content: string): DocumentValidationAnalysis {
    const trimmedContent = content.trim()

    if (!trimmedContent) {
      return this.incompleteNativeOllamaAnalysis(
        'O Ollama respondeu HTTP 200, mas retornou conteúdo vazio.',
      )
    }

    try {
      return documentValidationAnalysisSchema.parse(JSON.parse(trimmedContent))
    } catch (error) {
      return this.incompleteNativeOllamaAnalysis(
        `O Ollama respondeu, mas o JSON retornado não pôde ser interpretado: ${this.resolveLiveAgentFailureReason(error)}`,
        trimmedContent,
      )
    }
  }

  private incompleteNativeOllamaAnalysis(
    reason: string,
    rawContent?: string,
  ): DocumentValidationAnalysis {
    return {
      status: DocumentValidationStatus.Incomplete,
      aiConfidence: 20,
      extractedFields: [],
      missingFields: [...DOCUMENT_VALIDATION_REQUIRED_FIELDS],
      aiSuggestion: {
        confidenceLabel: 'Baixa confiança',
        documentTypeId: 'comprovante_residencia',
        checklistItemLabel: 'Comprovante de residência',
        localModelWarning: reason,
        ...(rawContent
          ? { rawModelOutputPreview: rawContent.slice(0, 500) }
          : {}),
      },
    }
  }

  private createNativeOllamaPrompt(document: DocumentValidationDocument) {
    return JSON.stringify({
      task: 'document_validation_metadata_only',
      instruction:
        'Analyze only this file metadata. OCR text is not available. Do not invent document contents. Return incomplete when required fields cannot be proven from metadata.',
      allowedStatuses: [
        DocumentValidationStatus.Valid,
        DocumentValidationStatus.Incomplete,
        DocumentValidationStatus.NotLinked,
        DocumentValidationStatus.Illegible,
        DocumentValidationStatus.Duplicate,
        DocumentValidationStatus.NotCorresponding,
        DocumentValidationStatus.ProcessingFailure,
      ],
      allowedFieldLabels: DOCUMENT_VALIDATION_REQUIRED_FIELDS,
      document: {
        fileName: document.fileName,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        currentStatus: document.status,
      },
      requiredJsonShape: {
        status: 'one allowed status',
        aiConfidence: 'number 0-100',
        extractedFields: [],
        missingFields: DOCUMENT_VALIDATION_REQUIRED_FIELDS,
        aiSuggestion: {
          confidenceLabel: 'short label',
        },
      },
    })
  }

  private normalizeLiveAnalysis(
    analysis: DocumentValidationAnalysis,
  ): DocumentValidationAnalysis {
    const extractedFields = analysis.extractedFields.filter((field) => {
      const label = field.label

      return (
        typeof label === 'string' &&
        DOCUMENT_VALIDATION_REQUIRED_FIELDS_SET.has(label) &&
        typeof field.value === 'string' &&
        field.value.trim().length > 0
      )
    })

    const extractedFieldLabels = new Set(
      extractedFields
        .map((field) => field.label)
        .filter((label): label is string => typeof label === 'string'),
    )
    const missingFields = DOCUMENT_VALIDATION_REQUIRED_FIELDS.filter(
      (field) =>
        !extractedFieldLabels.has(field) || analysis.missingFields.includes(field),
    )

    const status =
      analysis.status === DocumentValidationStatus.Valid && missingFields.length > 0
        ? DocumentValidationStatus.Incomplete
        : analysis.status

    return {
      ...analysis,
      status,
      extractedFields,
      missingFields,
      aiSuggestion: {
        ...(analysis.aiSuggestion ?? {}),
        outputNormalized: true,
        acceptedFieldLabels: DOCUMENT_VALIDATION_REQUIRED_FIELDS,
      },
    }
  }

  private resolveLiveAgentFailureReason(error: unknown) {
    if (error instanceof Error && error.message) {
      return `A chamada ao agente de IA falhou: ${error.message}`
    }

    return 'A chamada ao agente de IA falhou por um erro desconhecido.'
  }

  private deterministicAnalysis(
    document: DocumentValidationDocument,
  ): DocumentValidationAnalysis {
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
      return this.processingFailureAnalysis({
        failureReason: 'Arquivo protegido por senha',
      })
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
        provider: 'document-validation-ai-deterministic-fallback',
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
        provider: 'document-validation-ai-deterministic-fallback',
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
      aiSuggestion: {
        provider: 'document-validation-ai-deterministic-fallback',
        confidenceLabel: 'Baixa confiança',
      },
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
        provider: 'document-validation-ai-deterministic-fallback',
        confidenceLabel: 'Sugerido pela IA',
        documentTypeId: 'comprovante_residencia',
        caseLabel: 'Caso 0089',
        checklistItemLabel: 'Comprovante de residência',
        originalDocumentFileName: 'comprovante-residencia.pdf',
      },
    }
  }

  private processingFailureAnalysis(input: {
    provider?: string
    failureReason: string
    failureInstruction?: string
  }): DocumentValidationAnalysis {
    return {
      status: DocumentValidationStatus.ProcessingFailure,
      aiConfidence: 0,
      extractedFields: [],
      missingFields: [],
      aiSuggestion: {
        provider: input.provider ?? 'document-validation-ai-deterministic-fallback',
        confidenceLabel: 'Falha no processamento',
        failureReason: input.failureReason,
        failureInstruction:
          input.failureInstruction ??
          'Solicite ao remetente uma nova cópia do arquivo sem proteção por senha.',
      },
    }
  }
}
