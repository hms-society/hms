import { describe, expect, it } from 'vitest'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'

import { ClassifyDocumentFileTool } from '../classify-document-file-tool'

const HASH_SHA_256 = 'a388cba9c4ec5b2a9bdbe8327e3a46d67e7261cc698f24ce4b7185041cbf4cd3'

describe('Classify Document File Tool', () => {
  it('keeps duplicate suggestions without reclassifying the document', async () => {
    const tool = new ClassifyDocumentFileTool()
    const input = createInput({
      suggestion: {
        suggestedStatus: DocumentValidationStatus.Duplicate,
        confidence: 1,
        confidenceLabel: 'Duplicidade identificada por hash',
        extractedFields: [],
        missingFields: [],
        evidence: [{ field: 'Arquivo', sourceText: 'Documento já recebido.' }],
        originalDocumentId: '6acb19bd-1e80-4506-ad87-f603afe03a47',
      },
    })

    const result = await tool.function.execute(input)

    expect(result.suggestion).toEqual(input.suggestion)
  })

  it('extracts all functional identification fields from readable OCR text', async () => {
    const tool = new ClassifyDocumentFileTool()

    const result = await tool.function.execute(
      createInput({
        metadata: {
          mimeType: 'image/png',
          sizeBytes: 28_263,
          hashSha256: HASH_SHA_256,
          textLength: 298,
          extractedTextFull:
            'DOCUMENTO DE IDENTIFICAÇÃO FUNÇIONAL (TESTE) Nome: Carlos Eduardo Ferreira Matrícula: MF-208734 Cargo: Analista de Sistemas Departamento: Tecnologia da Informação Admissão: 02/05/2018 Validade: 31/12/2027 Código de barras (simulado): 1011010110110101',
        },
      }),
    )

    expect(result.suggestion.suggestedStatus).toBe(DocumentValidationStatus.NotLinked)
    expect(result.suggestion.documentTypeId).toBe('functional_identification')
    expect(result.suggestion.confidence).toBeLessThanOrEqual(1)
    expect(result.suggestion.extractedFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Nome',
          value: 'Carlos Eduardo Ferreira',
        }),
        expect.objectContaining({
          label: 'Matrícula',
          value: 'MF-208734',
        }),
        expect.objectContaining({
          label: 'Cargo',
          value: 'Analista de Sistemas',
        }),
        expect.objectContaining({
          label: 'Departamento',
          value: 'Tecnologia da Informação',
        }),
        expect.objectContaining({
          label: 'Admissão',
          value: '02/05/2018',
        }),
        expect.objectContaining({
          label: 'Validade',
          value: '31/12/2027 Código de barras (simulado): 1011010110110101',
        }),
      ]),
    )
  })

  it('keeps processing failure suggestions without marking the document illegible', async () => {
    const tool = new ClassifyDocumentFileTool()
    const input = createInput({
      suggestion: {
        suggestedStatus: DocumentValidationStatus.ProcessingFailure,
        confidence: 0,
        confidenceLabel: 'Falha no processamento automático',
        extractedFields: [],
        missingFields: [],
        evidence: [],
        failureReason: 'A IA retornou erro.',
      },
    })

    const result = await tool.function.execute(input)

    expect(result.suggestion.suggestedStatus).toBe(
      DocumentValidationStatus.ProcessingFailure,
    )
    expect(result.suggestion.failureReason).toBe('A IA retornou erro.')
  })
})

function createInput(overrides: Record<string, unknown> = {}) {
  return {
    batchId: '8d307185-4869-4a3a-b781-2dae902f821d',
    documentFileId: '746d73af-b629-4fe9-a4ee-e4ea3c9b2ba1',
    metadata: {
      mimeType: 'image/png',
      sizeBytes: 28_263,
      hashSha256: HASH_SHA_256,
      textLength: 0,
      extractedTextFull: '',
    },
    ...overrides,
  }
}
