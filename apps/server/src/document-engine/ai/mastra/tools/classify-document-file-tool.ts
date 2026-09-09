import { createTool } from '@mastra/core/tools'
import { Injectable } from '@nestjs/common'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'
import { z } from 'zod'

import {
  outputSchema as workflowOutputSchema,
  suggestionSchema,
} from '@/document-engine/ai/mastra/schemas'

const inputSchema = workflowOutputSchema
const outputSchema = workflowOutputSchema.required({ suggestion: true })
const MAX_EVIDENCE_TEXT_CHARS = 240
const LABEL_VALUE_PATTERN =
  /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9 /_.-]{1,40})\s*:\s*([^:]+?)(?=\s+[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9 /_.-]{1,40}\s*:|$)/g

type DocumentSuggestion = z.output<typeof suggestionSchema>
type ExtractedField = DocumentSuggestion['extractedFields'][number]
type Evidence = DocumentSuggestion['evidence'][number]

@Injectable()
export class ClassifyDocumentFileTool {
  readonly function: ReturnType<
    typeof createTool<'classify-document-file', typeof inputSchema, typeof outputSchema>
  >

  constructor() {
    this.function = createTool({
      id: 'classify-document-file',
      description:
        'Classify a document validation record deterministically from OCR metadata.',
      inputSchema,
      outputSchema,
      strict: true,
      execute: async (input) => {
        if (input.suggestion?.suggestedStatus === DocumentValidationStatus.Duplicate) {
          return input as z.infer<typeof outputSchema>
        }

        return {
          ...input,
          suggestion: this.classify(input),
        }
      },
    })
  }

  private classify(input: z.infer<typeof inputSchema>): DocumentSuggestion {
    const extractedText = input.metadata.extractedTextFull ?? ''
    const isReadableTextPresent = this.hasReadableText(extractedText)

    if (!isReadableTextPresent) {
      return {
        suggestedStatus: DocumentValidationStatus.Illegible,
        confidence: 0.1,
        confidenceLabel: 'Texto ilegível',
        extractedFields: [],
        missingFields: [],
        evidence: [],
        failureReason: 'O OCR não encontrou texto legível suficiente no documento.',
        failureInstruction:
          'Revise a imagem manualmente ou solicite reenvio em melhor qualidade.',
      }
    }

    const documentType = this.inferDocumentType(extractedText)
    const extractedFields = this.extractFields(extractedText, documentType?.id)
    const checklistItem = this.resolveChecklistItem(input)
    const status = checklistItem
      ? DocumentValidationStatus.AwaitingValidation
      : DocumentValidationStatus.NotLinked

    return {
      suggestedStatus: status,
      documentTypeId: documentType?.id,
      documentTypeLabel: documentType?.label,
      checklistItemId: checklistItem?.id,
      checklistItemLabel: checklistItem?.label,
      caseId: checklistItem?.caseId,
      caseLabel: this.resolveCaseLabel(input, checklistItem?.caseId),
      confidence: extractedFields.length > 0 ? 0.45 : 0.25,
      confidenceLabel: extractedFields.length > 0 ? 'Média confiança' : 'Baixa confiança',
      extractedFields,
      missingFields: [],
      evidence: this.buildEvidence(extractedText, extractedFields),
      failureReason:
        status === DocumentValidationStatus.NotLinked
          ? 'Nenhum vínculo seguro de caso ou checklist foi identificado automaticamente.'
          : undefined,
      failureInstruction:
        status === DocumentValidationStatus.NotLinked
          ? 'Selecione manualmente o caso e o item de checklist antes de confirmar.'
          : 'Confirme manualmente a validação antes de concluir o documento.',
    }
  }

  private hasReadableText(text: string) {
    return /[A-Za-zÀ-ÿ0-9]{3,}/.test(text)
  }

  private extractFields(
    text: string,
    documentTypeId: string | undefined,
  ): ExtractedField[] {
    if (documentTypeId === 'functional_identification') {
      const fields = this.extractDelimitedFields(text, [
        'Nome',
        'Matrícula',
        'Cargo',
        'Departamento',
        'Admissão',
        'Validade',
      ])

      if (fields.length > 0) return fields
    }

    const fields: ExtractedField[] = []

    for (const match of text.matchAll(LABEL_VALUE_PATTERN)) {
      const label = this.normalizeLabel(match[1])
      const value = this.normalizeValue(match[2])

      if (!label || !value || this.isNoisyValue(value)) continue

      fields.push({
        label,
        value,
        confidence: 0.85,
        isMissing: false,
      })
    }

    return fields.slice(0, 12)
  }

  private extractDelimitedFields(text: string, labels: string[]): ExtractedField[] {
    return labels.flatMap((label, index) => {
      const value = this.extractDelimitedValue(text, label, labels.slice(index + 1))

      if (!value || this.isNoisyValue(value)) return []

      return {
        label,
        value,
        confidence: 0.9,
        isMissing: false,
      }
    })
  }

  private extractDelimitedValue(text: string, label: string, followingLabels: string[]) {
    const followingLabelPattern = followingLabels
      .map((followingLabel) => this.escapeRegExp(followingLabel))
      .join('|')
    const endPattern =
      followingLabelPattern.length > 0
        ? `(?=\\s+(?:${followingLabelPattern})\\s*:|$)`
        : '$'
    const match = new RegExp(
      `${this.escapeRegExp(label)}\\s*:\\s*(.*?)${endPattern}`,
      'iu',
    ).exec(text)

    if (!match?.[1]) return undefined

    return this.normalizeValue(match[1])
  }

  private escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private normalizeLabel(label: string) {
    return label.trim().replace(/\s+/g, ' ')
  }

  private normalizeValue(value: string) {
    return value.trim().replace(/\s+/g, ' ').slice(0, 160)
  }

  private isNoisyValue(value: string) {
    return value.length === 0 || /^[|_\-.\s]+$/.test(value)
  }

  private inferDocumentType(text: string) {
    const normalizedText = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

    if (
      normalizedText.includes('documento de identificacao funcional') ||
      (normalizedText.includes('matricula') &&
        normalizedText.includes('cargo') &&
        normalizedText.includes('departamento'))
    ) {
      return {
        id: 'functional_identification',
        label: 'Documento de identificação funcional',
      }
    }

    if (
      normalizedText.includes('nota fiscal') ||
      normalizedText.includes('invoice') ||
      normalizedText.includes('total') ||
      normalizedText.includes('valor')
    ) {
      return {
        id: 'invoice',
        label: 'Nota fiscal',
      }
    }

    return undefined
  }

  private resolveChecklistItem(input: z.infer<typeof inputSchema>) {
    const checklistItems = input.referenceCandidates?.checklistItems ?? []

    if (checklistItems.length !== 1) return undefined

    return checklistItems[0]
  }

  private resolveCaseLabel(
    input: z.infer<typeof inputSchema>,
    caseId: string | undefined,
  ) {
    if (!caseId) return undefined

    return input.referenceCandidates?.cases.find((candidate) => candidate.id === caseId)
      ?.label
  }

  private buildEvidence(text: string, fields: ExtractedField[]): Evidence[] {
    if (fields.length === 0) {
      return [
        {
          field: 'Texto extraído',
          sourceText: text.trim().replace(/\s+/g, ' ').slice(0, MAX_EVIDENCE_TEXT_CHARS),
        },
      ]
    }

    return fields.slice(0, 6).map((field) => ({
      field: field.label,
      sourceText: `${field.label}: ${field.value}`.slice(0, MAX_EVIDENCE_TEXT_CHARS),
    }))
  }
}
