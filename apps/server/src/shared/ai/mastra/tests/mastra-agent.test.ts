import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { AppError } from '@hms/core/shared/domain/errors'

import { DocumentWriterAgent } from '@/document-production/ai/mastra/agents/document-writer-agent'
import { DocumentReviewerAgent } from '@/document-production/ai/mastra/agents/document-reviewer-agent'
import { DocumentImageAnalyzerAgent } from '@/document-engine/ai/mastra/agents/document-image-analyzer-agent'
import { EnvProvider } from '@/shared/provision/env/env-provider'

const MODELS = [
  'qwen/qwen3.8-27b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'dots-studio/dots-3-note-preview:free',
  'liquid/lfm-2.5-2.6b:free',
]

afterEach(() => vi.unstubAllGlobals())

describe('Document drafting model resolution', () => {
  it.each([
    DocumentWriterAgent,
    DocumentReviewerAgent,
  ])('uses native fallbacks in order and preserves structured output for %s', async (Agent) => {
    const requestedModels: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, init) => {
        const body = JSON.parse(init.body)
        requestedModels.push(body.model)

        if (body.model !== MODELS[3]) {
          return Response.json(
            { error: { message: 'Model unavailable', code: 429 } },
            { status: 429 },
          )
        }

        const chunk = {
          id: 'test-completion',
          object: 'chat.completion',
          created: 0,
          model: body.model,
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: '{"result":"draft"}' },
              finish_reason: 'stop',
            },
          ],
        }

        return Response.json(chunk)
      }),
    )

    const agent = new Agent(createEnvProvider('dev'))
    const response = await agent.generate('Generate a draft.', {
      structuredOutput: { schema: z.object({ result: z.string() }) },
    })

    expect(requestedModels).toEqual(MODELS)
    expect(response.object).toEqual({ result: 'draft' })
  })

  it.each([
    DocumentWriterAgent,
    DocumentReviewerAgent,
  ])('requires OpenRouter credentials locally for %s', (Agent) => {
    expect(() => new Agent(createEnvProvider('dev', undefined))).toThrow(AppError)
  })

  it.each(['stg'])('keeps per-agent models in %s', (mode) => {
    const envProvider = createEnvProvider(mode)

    expect(new DocumentWriterAgent(envProvider).model).toMatchObject({
      providerId: 'openrouter',
      modelId: 'deepseek/deepseek-v4-pro',
    })
    expect(new DocumentReviewerAgent(envProvider).model).toMatchObject({
      providerId: 'openrouter',
      modelId: 'deepseek/deepseek-v4-flash',
    })
  })

  it.each([
    {
      role: 'writer',
      Agent: DocumentWriterAgent,
      routes: [
        ['deepseek/deepseek-v4.1-flash', 'deepinfra'],
        ['deepseek/deepseek-v4.1-flash', 'coreweave'],
        ['deepseek/deepseek-v4.1-flash', 'nextbit'],
        ['openai/gpt-6-luna', 'azure'],
        ['openai/gpt-6-luna', 'openai'],
      ],
    },
    {
      role: 'reviewer',
      Agent: DocumentReviewerAgent,
      routes: [
        ['openai/gpt-6-luna', 'azure'],
        ['openai/gpt-6-luna', 'openai'],
        ['deepseek/deepseek-v4.1-flash', 'deepinfra'],
        ['deepseek/deepseek-v4.1-flash', 'coreweave'],
        ['deepseek/deepseek-v4.1-flash', 'nextbit'],
      ],
    },
  ])('tries the production $role routes in order', async ({ Agent, routes }) => {
    const requestedRoutes: unknown[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, init) => {
        const body = JSON.parse(init.body)
        requestedRoutes.push({ model: body.model, provider: body.provider })
        return Response.json(
          { error: { message: 'Provider unavailable', code: 503 } },
          { status: 503 },
        )
      }),
    )

    await expect(
      new Agent(createEnvProvider('prod')).generate('Generate a draft.', {
        structuredOutput: { schema: z.object({ result: z.string() }) },
      }),
    ).rejects.toThrow('Provider unavailable')

    expect(requestedRoutes).toEqual(
      routes.map(([model, provider]) => ({
        model,
        provider: { only: [provider], allow_fallbacks: false, require_parameters: true },
      })),
    )
  })

  it('preserves local Ollama vision extraction', () => {
    expect(new DocumentImageAnalyzerAgent(createEnvProvider('dev')).model).toMatchObject({
      providerId: 'ollama',
      modelId: 'local-vision-model',
      url: 'http://localhost:11434/v1',
    })
  })

  it('fails after exhausting the free models without calling a paid model', async () => {
    const requestedModels: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, init) => {
        requestedModels.push(JSON.parse(init.body).model)
        return Response.json(
          { error: { message: 'Model unavailable', code: 429 } },
          { status: 429 },
        )
      }),
    )

    const agent = new DocumentWriterAgent(createEnvProvider('dev'))

    await expect(
      agent.generate('Generate a draft.', {
        structuredOutput: { schema: z.object({ result: z.string() }) },
      }),
    ).rejects.toThrow('Model unavailable')
    expect(requestedModels).toEqual(MODELS)
  })
})

function createEnvProvider(mode: string, ...credentials: [string | undefined] | []) {
  const values: Record<string, string | undefined> = {
    HMS_SERVER_APP_MODE: mode,
    OPENROUTER_API_KEY: credentials.length ? credentials[0] : 'test-key',
    OLLAMA_AI_MODEL: 'local-text-model',
    OLLAMA_VISION_AI_MODEL: 'local-vision-model',
  }

  return { get: vi.fn((key: string) => values[key]) } as unknown as EnvProvider
}
