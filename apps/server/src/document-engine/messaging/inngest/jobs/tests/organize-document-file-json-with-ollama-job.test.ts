import { DocumentValidationDocumentFaker } from '@hms/core/document-engine/domain/entities/fakers'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrganizeDocumentFileJsonWithOllamaJob } from '../organize-document-file-json-with-ollama-job'

const DOCUMENT_FILE_ID = '746d73af-b629-4fe9-a4ee-e4ea3c9b2ba1'
const BATCH_ID = '8d307185-4869-4a3a-b781-2dae902f821d'
const CASE_ID = '280a32bf-e9ae-4784-8c72-7a4d762795e2'
const CHECKLIST_ITEM_ID = 'cfde6733-4a0e-47e4-a2cd-f4aab7e4c6da'
const HASH_SHA_256 = 'a388cba9c4ec5b2a9bdbe8327e3a46d67e7261cc698f24ce4b7185041cbf4cd3'

describe('OrganizeDocumentFileJsonWithOllamaJob', () => {
  let job: OrganizeDocumentFileJsonWithOllamaJob
  let mockInngest: any
  let mockAgent: any
  let mockRepository: any
  let generatedPrompt: string

  beforeEach(() => {
    mockInngest = {
      createFunction: vi.fn((_configuration, handler) => handler),
    }
    mockAgent = {
      generate: vi.fn(async (messages) => {
        generatedPrompt = messages[0].content
        return { text: JSON.stringify(createSuggestion()) }
      }),
    }
    mockRepository = {
      findByFileId: vi.fn().mockResolvedValue(
        DocumentValidationDocumentFaker.fake({
          id: DOCUMENT_FILE_ID,
          batchId: BATCH_ID,
          status: DocumentValidationStatus.Processing,
          checklistLink: { caseId: CASE_ID, checklistItemId: CHECKLIST_ITEM_ID },
        }),
      ),
      recordAnalysis: vi.fn().mockResolvedValue(undefined),
    }

    job = new OrganizeDocumentFileJsonWithOllamaJob(
      mockInngest,
      mockAgent,
      mockRepository,
    )
  })

  it('does not persist city or CEP values split across adjacent labeled fields', async () => {
    const extractedTextFull =
      'Nome: Ana Silva\nCidade: São José dos Campos\nCEP: 12223-353'
    mockAgent.generate.mockImplementationOnce(async () => ({
      text: JSON.stringify(
        createSuggestion({
          extractedFields: [
            { label: 'Nome', value: 'Ana Silva', confidence: 0.98 },
            { label: 'Cidade', value: 'São José dos', confidence: 0.94 },
            { label: 'CEP', value: 'Campos 12223-353', confidence: 0.91 },
          ],
          evidence: [
            { field: 'Nome', sourceText: 'Nome: Ana Silva' },
            { field: 'Cidade', sourceText: 'Cidade: São José dos' },
            { field: 'CEP', sourceText: 'CEP: Campos 12223-353' },
          ],
        }),
      ),
    }))

    await runJob(extractedTextFull)

    expect(mockRepository.recordAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        extractedFields: [expect.objectContaining({ label: 'Nome', value: 'Ana Silva' })],
      }),
    )
  })

  it('keeps complete labeled values with evidence matching the OCR source', async () => {
    const extractedTextFull =
      'Nome: Ana Silva\nCidade: São José dos Campos\nCEP: 12223-353'
    mockAgent.generate.mockImplementationOnce(async () => ({
      text: JSON.stringify(
        createSuggestion({
          extractedFields: [
            { label: 'Cidade', value: 'São José dos Campos', confidence: 0.94 },
            { label: 'CEP', value: '12223-353', confidence: 0.91 },
          ],
          evidence: [
            { field: 'Cidade', sourceText: 'Cidade: São José dos Campos' },
            { field: 'CEP', sourceText: 'CEP: 12223-353' },
          ],
        }),
      ),
    }))

    await runJob(extractedTextFull)

    expect(mockRepository.recordAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        extractedFields: [
          expect.objectContaining({
            label: 'Cidade',
            value: 'São José dos Campos',
          }),
          expect.objectContaining({ label: 'CEP', value: '12223-353' }),
        ],
      }),
    )
  })

  it('organizes complete fields from flattened text without label delimiters', async () => {
    const extractedTextFull =
      'Nome Vinicius Lopes Machado CPF 123.456.789-09 Cidade São José dos Campos CEP 12233-470'
    mockAgent.generate.mockImplementationOnce(async () => ({
      text: JSON.stringify(
        createSuggestion({
          extractedFields: [
            { label: 'Nome', value: 'Vinicius Lopes Machado', confidence: 0.96 },
            { label: 'CPF', value: '123.456.789-09', confidence: 0.98 },
            { label: 'Cidade', value: 'São José dos Campos', confidence: 0.91 },
            { label: 'CEP', value: '12233-470', confidence: 0.97 },
          ],
          evidence: [
            { field: 'Nome', sourceText: 'Nome Vinicius Lopes Machado' },
            { field: 'CPF', sourceText: 'CPF 123.456.789-09' },
            { field: 'Cidade', sourceText: 'Cidade São José dos Campos' },
            { field: 'CEP', sourceText: 'CEP 12233-470' },
          ],
        }),
      ),
    }))

    await runJob(extractedTextFull)

    expect(mockRepository.recordAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        extractedFields: [
          expect.objectContaining({ label: 'Nome', value: 'Vinicius Lopes Machado' }),
          expect.objectContaining({ label: 'CPF', value: '123.456.789-09' }),
          expect.objectContaining({ label: 'Cidade', value: 'São José dos Campos' }),
          expect.objectContaining({ label: 'CEP', value: '12233-470' }),
        ],
      }),
    )
  })

  it('preserves source-supported low-confidence fields for internal review filtering', async () => {
    const extractedTextFull = 'Nome Vinicius Lopes Machado CPF 123.456.789-09'
    mockAgent.generate.mockImplementationOnce(async () => ({
      text: JSON.stringify(
        createSuggestion({
          extractedFields: [
            { label: 'Nome', value: 'Vinicius Lopes Machado', confidence: 0.96 },
            { label: 'CPF', value: '123.456.789-09', confidence: 0.42 },
          ],
          evidence: [
            { field: 'Nome', sourceText: 'Nome Vinicius Lopes Machado' },
            { field: 'CPF', sourceText: 'CPF 123.456.789-09' },
          ],
        }),
      ),
    }))

    await runJob(extractedTextFull)

    expect(mockRepository.recordAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        extractedFields: [
          expect.objectContaining({ label: 'Nome', confidence: 0.96 }),
          expect.objectContaining({ label: 'CPF', confidence: 0.42 }),
        ],
      }),
    )
  })

  it('leaves unverified OCR fields empty for manual validation instead of saving bad values', async () => {
    const extractedTextFull = 'Cidade: São José dos Campos\nCEP: 12223-353'
    mockAgent.generate.mockImplementationOnce(async () => ({
      text: JSON.stringify(
        createSuggestion({
          extractedFields: [
            { label: 'Cidade', value: 'São José dos', confidence: 0.94 },
            { label: 'CEP', value: 'Campos 12223-353', confidence: 0.91 },
          ],
          evidence: [
            { field: 'Cidade', sourceText: 'Cidade: São José dos' },
            { field: 'CEP', sourceText: 'CEP: Campos 12223-353' },
          ],
        }),
      ),
    }))

    const result = await runJob(extractedTextFull)

    expect(mockRepository.recordAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        aiConfidence: 0,
        extractedFields: [],
        status: DocumentValidationStatus.AwaitingValidation,
        aiSuggestion: expect.objectContaining({
          confidenceLabel: 'Campos não confirmados — revisão manual',
          ollamaJsonOrganizationCaptured: false,
        }),
      }),
    )
    expect(result).toEqual({
      skipped: true,
      reason: 'no_source_verified_fields',
      documentFileId: DOCUMENT_FILE_ID,
    })
  })

  it('rejects a single field that swallows the title and multiple OCR table rows', async () => {
    const extractedTextFull =
      'Fatura de consumo\nCliente: Helena Maria de Albuquerque Costa\nCPF/CNPJ: 123.456.789-09\nCEP do imóvel: 12233-470'
    mockAgent.generate.mockImplementationOnce(async () => ({
      text: JSON.stringify(
        createSuggestion({
          extractedFields: [
            {
              label: 'Fatura de consumo',
              value:
                'Cliente: Helena Maria de Albuquerque Costa CPF/CNPJ: 123.456.789-09 CEP do imóvel: 12233-470',
              confidence: 0.9,
            },
          ],
          evidence: [
            {
              field: 'Fatura de consumo',
              sourceText:
                'Fatura de consumo Cliente: Helena Maria de Albuquerque Costa CPF/CNPJ: 123.456.789-09 CEP do imóvel: 12233-470',
            },
          ],
        }),
      ),
    }))

    const result = await runJob(extractedTextFull)

    expect(mockRepository.recordAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        aiConfidence: 0,
        extractedFields: [],
        aiSuggestion: expect.objectContaining({
          confidenceLabel: 'Campos não confirmados — revisão manual',
          ollamaJsonOrganizationCaptured: false,
        }),
      }),
    )
    expect(result).toEqual({
      skipped: true,
      reason: 'no_source_verified_fields',
      documentFileId: DOCUMENT_FILE_ID,
    })
  })

  it('rejects a flattened OCR value containing additional document field labels', async () => {
    const extractedTextFull =
      'O DE TESTE - DADOS FICTÍCIOS - Referência: setembro de 2026 DESAFIO DE EXTRAÇÃO E ORGANIZAÇÃO DOCUMENTAL Cliente Helena Maria de Albuquerque Costa CPF/CNPJ 123.456.789-09 Endereço de instalação Rua das Palmeiras, 728'
    mockAgent.generate.mockImplementationOnce(async () => ({
      text: JSON.stringify(
        createSuggestion({
          extractedFields: [
            {
              label: 'O DE TESTE - DADOS FICTÍCIOS - Referência',
              value:
                'setembro de 2026 DESAFIO DE EXTRAÇÃO E ORGANIZAÇÃO DOCUMENTAL Cliente Helena Maria de Albuquerque Costa CPF/CNPJ 123.456.789-09 Endereço de instalação Rua das Palmeiras, 728',
              confidence: 0.9,
            },
          ],
          evidence: [
            {
              field: 'O DE TESTE - DADOS FICTÍCIOS - Referência',
              sourceText:
                'O DE TESTE - DADOS FICTÍCIOS - Referência: setembro de 2026 DESAFIO DE EXTRAÇÃO E ORGANIZAÇÃO DOCUMENTAL Cliente Helena Maria de Albuquerque Costa CPF/CNPJ 123.456.789-09 Endereço de instalação Rua das Palmeiras, 728',
            },
          ],
        }),
      ),
    }))

    const result = await runJob(extractedTextFull)

    expect(mockRepository.recordAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        aiConfidence: 0,
        extractedFields: [],
        aiSuggestion: expect.objectContaining({
          confidenceLabel: 'Campos não confirmados — revisão manual',
          ollamaJsonOrganizationCaptured: false,
        }),
      }),
    )
    expect(result).toEqual({
      skipped: true,
      reason: 'no_source_verified_fields',
      documentFileId: DOCUMENT_FILE_ID,
    })
  })

  it('sends the complete OCR source to the organizer without flattening or truncation', async () => {
    const extractedTextFull = `Página 1\n${'Texto reconhecido. '.repeat(200)}\nCidade: São José dos Campos\nCEP: 12223-353`

    await runJob(extractedTextFull)

    expect(generatedPrompt).toContain(extractedTextFull)
  })

  async function runJob(extractedTextFull: string) {
    const handler = job.function as any
    const step = {
      run: vi.fn(async (_name: string, callback: () => Promise<unknown>) => callback()),
    }
    const event = {
      data: {
        batchId: BATCH_ID,
        documentFileId: DOCUMENT_FILE_ID,
        storagePath: 'documents/ana-silva.pdf',
        originalName: 'ana-silva.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        hashSha256: HASH_SHA_256,
        extractedTextFull,
      },
    }

    return handler({ event, step })
  }
})

function createSuggestion(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    confidence: 0.9,
    extractedFields: [{ label: 'Nome', value: 'Ana Silva', confidence: 0.98 }],
    evidence: [{ field: 'Nome', sourceText: 'Nome: Ana Silva' }],
    ...overrides,
  }
}
