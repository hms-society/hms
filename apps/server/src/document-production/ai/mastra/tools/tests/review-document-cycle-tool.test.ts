import {
  DocumentReviewDecision,
  DocumentReviewFindingCategory,
} from '@hms/core/document-production/domain/structures'
import { FindDocumentPendingMarkersUseCase } from '@hms/core/document-production/use-cases'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import {
  DocumentReviewerAgent,
  DocumentWriterAgent,
} from '@/document-production/ai/mastra/agents'
import { ReviewDocumentCycleTool } from '@/document-production/ai/mastra/tools/review-document-cycle-tool'
import { EnvProvider } from '@/shared/provision/env/env-provider'

describe('ReviewDocumentCycleTool', () => {
  let writerGenerate: ReturnType<typeof vi.fn>
  let reviewerGenerate: ReturnType<typeof vi.fn>
  let findPendingMarkers: ReturnType<typeof vi.fn>
  let writerOutput: {
    blocks: Array<{
      kind: string
      runs: Array<{ text: string; marks: string[] }>
    }>
  }

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    writerOutput = {
      blocks: [
        { kind: 'heading1', runs: [{ text: 'Requerimento', marks: [] }] },
        {
          kind: 'paragraph',
          runs: [
            { text: 'Requerente: ', marks: [] },
            { text: '{nome_requerente}', marks: ['bold'] },
          ],
        },
        { kind: 'bullet', runs: [{ text: 'Documento de identidade', marks: [] }] },
        { kind: 'bullet', runs: [{ text: 'Comprovante de residência', marks: [] }] },
      ],
    }
    writerGenerate = vi.fn().mockResolvedValue({ object: writerOutput })
    reviewerGenerate = vi.fn().mockResolvedValue({
      object: { decision: DocumentReviewDecision.Approved, findings: [] },
    })
    findPendingMarkers = vi.fn().mockResolvedValue([{ marker: '{nome_requerente}' }])
  })

  afterEach(() => vi.restoreAllMocks())

  it('converts the flat AI draft into validated Tiptap before review', async () => {
    const tool = new ReviewDocumentCycleTool(
      { generate: writerGenerate } as unknown as DocumentWriterAgent,
      { generate: reviewerGenerate } as unknown as DocumentReviewerAgent,
      { execute: findPendingMarkers } as unknown as FindDocumentPendingMarkersUseCase,
      createEnvProvider('dev'),
    )

    const result = await tool.function.execute({
      documentGenerationId: '00000000-0000-4000-8000-000000000001',
      source: { type: 'case', id: 'case-1', data: {} },
      template: {
        name: 'Modelo previdenciário',
        content: { type: 'doc', content: [] },
        variables: [],
      },
      attemptsCount: 0,
    })

    const writerSchema = writerGenerate.mock.calls[0]?.[1].structuredOutput.schema
    expect(writerSchema.safeParse(writerOutput).success).toBe(true)
    expect(writerSchema.safeParse({ blocks: [] }).success).toBe(false)
    const writerJsonSchema = JSON.stringify(z.toJSONSchema(writerSchema))
    expect(writerJsonSchema).not.toContain('anyOf')
    expect(writerJsonSchema).not.toContain('$ref')
    expect(findPendingMarkers).toHaveBeenCalledWith({
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1, textAlign: null },
            content: [{ type: 'text', text: 'Requerimento' }],
          },
          expect.objectContaining({
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Requerente: ' },
              {
                type: 'text',
                text: '{nome_requerente}',
                marks: [{ type: 'bold' }],
              },
            ],
          }),
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Documento de identidade' }],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Comprovante de residência' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    })
    expect(result.draft.content.type).toBe('doc')
    expect(reviewerGenerate).toHaveBeenCalledOnce()
    const [logLabel, serializedResponse] = vi.mocked(console.log).mock.calls[0] ?? []
    expect(logLabel).toBe('[document-generation] writer AI response')
    expect(JSON.parse(String(serializedResponse))).toEqual({
      documentGenerationId: '00000000-0000-4000-8000-000000000001',
      attempt: 1,
      output: writerOutput,
    })
  })

  it('retries the review once when structured output validation fails', async () => {
    reviewerGenerate
      .mockRejectedValueOnce(
        new Error('Structured output validation failed: decision: Entrada inválida'),
      )
      .mockResolvedValueOnce({
        object: { decision: DocumentReviewDecision.Approved, findings: [] },
      })
    const tool = new ReviewDocumentCycleTool(
      { generate: writerGenerate } as unknown as DocumentWriterAgent,
      { generate: reviewerGenerate } as unknown as DocumentReviewerAgent,
      { execute: findPendingMarkers } as unknown as FindDocumentPendingMarkersUseCase,
      createEnvProvider('dev'),
    )

    await tool.function.execute({
      documentGenerationId: '00000000-0000-4000-8000-000000000001',
      source: { type: 'case', id: 'case-1', data: {} },
      template: {
        name: 'Modelo previdenciário',
        content: { type: 'doc', content: [] },
        variables: [],
      },
      attemptsCount: 0,
    })

    expect(reviewerGenerate).toHaveBeenCalledTimes(2)
    expect(reviewerGenerate.mock.calls[0]?.[0]).toContain('approved')
    expect(reviewerGenerate.mock.calls[0]?.[0]).toContain('changes_required')
    expect(reviewerGenerate.mock.calls[1]?.[0]).toContain('Return decision as exactly')
  })

  it('does not log generated legal content outside local development', async () => {
    const tool = new ReviewDocumentCycleTool(
      { generate: writerGenerate } as unknown as DocumentWriterAgent,
      { generate: reviewerGenerate } as unknown as DocumentReviewerAgent,
      { execute: findPendingMarkers } as unknown as FindDocumentPendingMarkersUseCase,
      createEnvProvider('stg'),
    )

    await tool.function.execute({
      documentGenerationId: '00000000-0000-4000-8000-000000000001',
      source: { type: 'case', id: 'case-1', data: {} },
      template: {
        name: 'Modelo previdenciário',
        content: { type: 'doc', content: [] },
        variables: [],
      },
      attemptsCount: 0,
    })

    expect(console.log).not.toHaveBeenCalled()
  })

  it('logs a null structured response in local development before failing clearly', async () => {
    writerGenerate.mockResolvedValueOnce({ object: undefined })
    const tool = new ReviewDocumentCycleTool(
      { generate: writerGenerate } as unknown as DocumentWriterAgent,
      { generate: reviewerGenerate } as unknown as DocumentReviewerAgent,
      { execute: findPendingMarkers } as unknown as FindDocumentPendingMarkersUseCase,
      createEnvProvider('dev'),
    )

    await expect(
      tool.function.execute({
        documentGenerationId: '00000000-0000-4000-8000-000000000001',
        source: { type: 'case', id: 'case-1', data: {} },
        template: {
          name: 'Modelo previdenciário',
          content: { type: 'doc', content: [] },
          variables: [],
        },
        attemptsCount: 0,
      }),
    ).rejects.toThrow('O agente redator não retornou um documento válido.')

    const [, serializedResponse] = vi.mocked(console.log).mock.calls[0] ?? []
    expect(JSON.parse(String(serializedResponse))).toEqual(
      expect.objectContaining({ output: null, attempt: 1 }),
    )
  })

  it('approves a draft when the only review finding is a placeholder for missing source data', async () => {
    findPendingMarkers.mockResolvedValue([{ marker: '{periodos_contributivos}' }])
    reviewerGenerate.mockResolvedValue({
      object: {
        decision: DocumentReviewDecision.ChangesRequired,
        findings: [
          {
            category: DocumentReviewFindingCategory.PendingCorrespondence,
            description:
              'O marcador {periodos_contributivos} não possui períodos no CNIS.',
            correction: 'Solicitar os períodos contributivos ao cliente.',
          },
        ],
      },
    })

    const tool = new ReviewDocumentCycleTool(
      { generate: writerGenerate } as unknown as DocumentWriterAgent,
      { generate: reviewerGenerate } as unknown as DocumentReviewerAgent,
      { execute: findPendingMarkers } as unknown as FindDocumentPendingMarkersUseCase,
      createEnvProvider('dev'),
    )

    const result = await tool.function.execute({
      documentGenerationId: '00000000-0000-4000-8000-000000000001',
      source: {
        type: 'case',
        id: 'case-1',
        data: { templateVariableValues: {} },
      },
      template: {
        name: 'Modelo previdenciário',
        content: { type: 'doc', content: [] },
        variables: [
          { label: 'Períodos contributivos', technicalName: 'periodos_contributivos' },
        ],
      },
      attemptsCount: 0,
    })

    expect(result.review).toEqual({
      decision: DocumentReviewDecision.Approved,
      findings: [],
    })
    expect(result.pendingMarkers).toEqual([{ marker: '{periodos_contributivos}' }])
  })

  it('keeps review findings when a pending marker has source data available', async () => {
    findPendingMarkers.mockResolvedValue([{ marker: '{periodos_contributivos}' }])
    reviewerGenerate.mockResolvedValue({
      object: {
        decision: DocumentReviewDecision.ChangesRequired,
        findings: [
          {
            category: DocumentReviewFindingCategory.PendingCorrespondence,
            description:
              'O marcador {periodos_contributivos} foi mantido apesar de haver dados.',
            correction: 'Substituir o marcador pelos períodos fornecidos.',
          },
        ],
      },
    })

    const tool = new ReviewDocumentCycleTool(
      { generate: writerGenerate } as unknown as DocumentWriterAgent,
      { generate: reviewerGenerate } as unknown as DocumentReviewerAgent,
      { execute: findPendingMarkers } as unknown as FindDocumentPendingMarkersUseCase,
      createEnvProvider('dev'),
    )

    const result = await tool.function.execute({
      documentGenerationId: '00000000-0000-4000-8000-000000000001',
      source: {
        type: 'case',
        id: 'case-1',
        data: { templateVariableValues: { periodos_contributivos: '2010 a 2025' } },
      },
      template: {
        name: 'Modelo previdenciário',
        content: { type: 'doc', content: [] },
        variables: [
          { label: 'Períodos contributivos', technicalName: 'periodos_contributivos' },
        ],
      },
      attemptsCount: 0,
    })

    expect(result.review.decision).toBe(DocumentReviewDecision.ChangesRequired)
    expect(result.review.findings).toHaveLength(1)
  })

  it('keeps structural findings while accepting placeholders for missing source data', async () => {
    findPendingMarkers.mockResolvedValue([{ marker: '{periodos_contributivos}' }])
    reviewerGenerate.mockResolvedValue({
      object: {
        decision: DocumentReviewDecision.ChangesRequired,
        findings: [
          {
            category: DocumentReviewFindingCategory.PendingCorrespondence,
            description: 'O marcador {periodos_contributivos} aguarda dados do CNIS.',
            correction: 'O advogado preencherá os períodos durante a revisão humana.',
          },
          {
            category: DocumentReviewFindingCategory.Structure,
            description: 'O rascunho não contém o endereçamento exigido pelo modelo.',
            correction: 'Incluir o endereçamento previsto no modelo.',
          },
        ],
      },
    })

    const tool = new ReviewDocumentCycleTool(
      { generate: writerGenerate } as unknown as DocumentWriterAgent,
      { generate: reviewerGenerate } as unknown as DocumentReviewerAgent,
      { execute: findPendingMarkers } as unknown as FindDocumentPendingMarkersUseCase,
      createEnvProvider('dev'),
    )

    const result = await tool.function.execute({
      documentGenerationId: '00000000-0000-4000-8000-000000000001',
      source: {
        type: 'case',
        id: 'case-1',
        data: { templateVariableValues: {} },
      },
      template: {
        name: 'Modelo previdenciário',
        content: { type: 'doc', content: [] },
        variables: [
          { label: 'Períodos contributivos', technicalName: 'periodos_contributivos' },
        ],
      },
      attemptsCount: 0,
    })

    expect(result.review.decision).toBe(DocumentReviewDecision.ChangesRequired)
    expect(result.review.findings).toEqual([
      {
        category: DocumentReviewFindingCategory.Structure,
        description: 'O rascunho não contém o endereçamento exigido pelo modelo.',
        correction: 'Incluir o endereçamento previsto no modelo.',
      },
    ])
  })

  it('does not retry provider availability errors', async () => {
    reviewerGenerate.mockRejectedValueOnce(new Error('Service Unavailable'))
    const tool = new ReviewDocumentCycleTool(
      { generate: writerGenerate } as unknown as DocumentWriterAgent,
      { generate: reviewerGenerate } as unknown as DocumentReviewerAgent,
      { execute: findPendingMarkers } as unknown as FindDocumentPendingMarkersUseCase,
      createEnvProvider('dev'),
    )

    await expect(
      tool.function.execute({
        documentGenerationId: '00000000-0000-4000-8000-000000000001',
        source: { type: 'case', id: 'case-1', data: {} },
        template: {
          name: 'Modelo previdenciário',
          content: { type: 'doc', content: [] },
          variables: [],
        },
        attemptsCount: 0,
      }),
    ).rejects.toThrow('Service Unavailable')

    expect(reviewerGenerate).toHaveBeenCalledOnce()
  })
})

function createEnvProvider(mode: 'dev' | 'stg' | 'prod') {
  return {
    get: (key: string) => (key === 'HMS_SERVER_APP_MODE' ? mode : undefined),
  } as EnvProvider
}
