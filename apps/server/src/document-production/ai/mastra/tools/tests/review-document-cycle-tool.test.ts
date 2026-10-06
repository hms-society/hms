import { afterEach, describe, expect, it, vi } from 'vitest'
import { FindDocumentPendingMarkersUseCase } from '@hms/core/document-production/use-cases'
import { DocumentGenerationFaker } from '@hms/core/document-production/domain/entities/fakers'
import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'

import {
  DocumentWriterAgent,
  DocumentReviewerAgent,
} from '@/document-production/ai/mastra/agents'
import { ReviewDocumentCycleTool } from '@/document-production/ai/mastra/tools/review-document-cycle-tool'
import { StartDocumentGenerationTool } from '@/document-production/ai/mastra/tools/start-document-generation-tool'
import { LoadDocumentGenerationTool } from '@/document-production/ai/mastra/tools/load-document-generation-tool'
import { documentReviewCycleOutputSchema } from '@/document-production/ai/mastra/schemas'
import type { EnvProvider } from '@/shared/provision/env/env-provider'

const DRAFT = {
  content: {
    type: 'doc',
    content: [
      {
        type: 'blockquote',
        content: [
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Client: {client_name}' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
}

afterEach(() => vi.unstubAllGlobals())

describe('Review Document Cycle Tool', () => {
  it.each([
    ['wrapped document', DRAFT],
    ['bare document', DRAFT.content],
    ['wrapped block array', { content: DRAFT.content.content }],
  ])('normalizes a %s before marker extraction and review', async (_shape, output) => {
    const requests: Record<string, any>[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, init) => {
        const body = JSON.parse(init.body)
        requests.push(body)
        return Response.json({
          id: 'normalized-draft',
          object: 'chat.completion',
          created: 0,
          model: body.model,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: JSON.stringify(
                  body.response_format ? { decision: 'approved', findings: [] } : output,
                ),
              },
              finish_reason: 'stop',
            },
          ],
        })
      }),
    )
    const result = await createTool().function.execute(createInput())
    expect(result.draft).toEqual(DRAFT)
    expect(result.pendingMarkers).toEqual([{ marker: '{client_name}' }])
    const reviewerMessage = requests[1].messages.find(
      (message: { role: string }) => message.role === 'user',
    )
    expect(JSON.parse(reviewerMessage.content).draft).toEqual(DRAFT)
    expect(requests).toHaveLength(2)
  })

  it('preserves regeneration instructions through start, load, writing and review', async () => {
    const input = createInput()
    const generation = DocumentGenerationFaker.fake({
      id: input.documentGenerationId,
      template: input.template,
      source: input.source,
      status: 'pending',
    })
    const started = { ...generation, status: 'running' as const }
    const repository = {
      findById: vi.fn().mockResolvedValueOnce(generation).mockResolvedValue(started),
      replace: vi.fn().mockResolvedValue(started),
    }
    const datetimeProvider = {
      now: vi.fn().mockReturnValue(new Date('2026-09-30T15:00:00Z')),
    }
    const start = new StartDocumentGenerationTool(
      repository as never,
      datetimeProvider as never,
    )
    const load = new LoadDocumentGenerationTool(repository as never)
    const requests: Record<string, any>[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, init) => {
        const body = JSON.parse(init.body)
        requests.push(body)
        return Response.json({
          id: 'test-completion',
          object: 'chat.completion',
          created: 0,
          model: body.model,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: JSON.stringify(
                  body.response_format ? { decision: 'approved', findings: [] } : DRAFT,
                ),
              },
              finish_reason: 'stop',
            },
          ],
        })
      }),
    )

    const workflow = createWorkflow({
      id: 'regeneration-instructions-regression',
      inputSchema: z.object({
        documentGenerationId: z.string().uuid(),
        instructions: z.string(),
        source: z.object({
          type: z.literal('consultation'),
          id: z.string(),
          data: z.record(z.string(), z.unknown()),
        }),
      }),
      outputSchema: documentReviewCycleOutputSchema,
    })
      .then(createStep(start.function))
      .then(createStep(load.function))
      .map(async ({ inputData }) => ({
        documentGenerationId: inputData.id,
        instructions: inputData.instructions,
        source: inputData.source,
        template: inputData.template,
        attemptsCount: 0,
      }))
      .then(createStep(createTool().function))
      .commit()
    const run = await workflow.createRun()
    const result = await run.start({
      inputData: {
        documentGenerationId: input.documentGenerationId,
        instructions: 'escreva em alemão',
        source: input.source,
      },
    })

    expect(result.status).toBe('success')
    expect(requests).toHaveLength(2)
    for (const request of requests) {
      const userMessage = request.messages.find(
        (message: { role: string }) => message.role === 'user',
      )
      expect(JSON.parse(userMessage.content).instructions).toBe('escreva em alemão')
    }
  })

  it('supports the recursive draft schema on Liquid after earlier models fail', async () => {
    const requests: Record<string, any>[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, init) => {
        const body = JSON.parse(init.body)
        requests.push(body)
        const isWriter = !body.response_format

        if (isWriter && body.model !== 'liquid/lfm-2.5-2.6b:free') {
          return Response.json(
            { error: { message: 'Model unavailable', code: 429 } },
            { status: 429 },
          )
        }

        const output = isWriter ? DRAFT : { decision: 'approved', findings: [] }
        return Response.json({
          id: 'test-completion',
          object: 'chat.completion',
          created: 0,
          model: body.model,
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: JSON.stringify(output) },
              finish_reason: 'stop',
            },
          ],
        })
      }),
    )

    const result = await createTool().function.execute(createInput())

    expect(requests.map((body) => body.model)).toEqual([
      'qwen/qwen3.8-27b:free',
      'nvidia/nemotron-3-super-120b-a12b:free',
      'dots-studio/dots-3-note-preview:free',
      'liquid/lfm-2.5-2.6b:free',
      'qwen/qwen3.8-27b:free',
    ])
    expect(requests.slice(0, 4).every((body) => body.response_format === undefined)).toBe(
      true,
    )
    expect(
      requests[3].messages.some((message: { content: string }) =>
        /schema/i.test(JSON.stringify(message.content)),
      ),
    ).toBe(true)
    expect(requests[4].response_format.type).toBe('json_schema')
    expect(result.draft).toEqual(DRAFT)
    expect(result.pendingMarkers).toEqual([{ marker: '{client_name}' }])
    expect(result.review).toEqual({ decision: 'approved', findings: [] })
  })

  it.each([
    { content: { type: 'doc', content: [{ type: 'unsupported' }] } },
    { content: [{ type: 'unsupported' }] },
    { type: 'doc', content: [{ type: 'text', text: 'Invalid block nesting' }] },
    { content: 'Not a document' },
  ])('rejects invalid draft content %j before invoking the reviewer', async (output) => {
    const fetch = vi.fn(async () =>
      Response.json({
        id: 'invalid-draft',
        object: 'chat.completion',
        created: 0,
        model: 'qwen/qwen3.8-27b:free',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify(output),
            },
            finish_reason: 'stop',
          },
        ],
      }),
    )
    vi.stubGlobal('fetch', fetch)

    await expect(createTool().function.execute(createInput())).rejects.toThrow()
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

function createTool() {
  const envProvider = {
    get: vi.fn((key: string) => {
      if (key === 'HMS_SERVER_APP_MODE') return 'dev'
      if (key === 'AI_PROVIDER') return 'openrouter'
      return 'test-key'
    }),
  } as unknown as EnvProvider

  return new ReviewDocumentCycleTool(
    new DocumentWriterAgent(envProvider),
    new DocumentReviewerAgent(envProvider),
    new FindDocumentPendingMarkersUseCase(),
  )
}

function createInput() {
  return {
    documentGenerationId: '746d73af-b629-4fe9-a4ee-e4ea3c9b2ba1',
    source: { type: 'consultation' as const, id: 'consultation-1', data: {} },
    template: { name: 'Test document', content: DRAFT.content, variables: [] },
    attemptsCount: 0,
  }
}
