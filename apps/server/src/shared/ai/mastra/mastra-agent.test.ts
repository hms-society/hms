import { describe, expect, it } from 'vitest'

import { AppError } from '@hms/core/shared/domain/errors'

import type { EnvProvider } from '@/shared/provision/env/env-provider'

import { MastraAgent } from './mastra-agent'

describe('MastraAgent model resolution', () => {
  it('keeps Ollama as the default local provider', () => {
    const agent = new TestMastraAgent(
      createEnvProvider({
        HMS_SERVER_APP_MODE: 'dev',
        OLLAMA_AI_MODEL: 'qwen3.5:2b',
      }),
    )

    expect(agent.model).toEqual({
      providerId: 'ollama',
      modelId: 'qwen3.5:2b',
      url: 'http://localhost:11434/v1',
      apiKey: 'ollama',
    })
  })

  it.each(
    (['openai', 'gemini'] as const).flatMap((provider) =>
      (['text', 'vision'] as const).map((modelType) => {
        const isVision = modelType === 'vision'
        const isOpenAi = provider === 'openai'
        const apiKey = `${provider}-test-key`
        const modelId = `${provider}-${isVision ? 'vision' : 'generative'}-model`

        return {
          provider,
          modelType,
          localModelEnvKey: isVision ? ('OLLAMA_VISION_AI_MODEL' as const) : undefined,
          env: {
            HMS_SERVER_APP_MODE: 'dev',
            AI_PROVIDER: provider,
            [isOpenAi ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY']: apiKey,
            [isOpenAi ? 'OPENAI_AI_MODEL' : 'GEMINI_AI_MODEL']:
              `${provider}-generative-model`,
            [isOpenAi ? 'OPENAI_VISION_AI_MODEL' : 'GEMINI_VISION_AI_MODEL']:
              `${provider}-vision-model`,
          },
          expectedModel: {
            providerId: provider,
            modelId,
            url: isOpenAi
              ? 'https://api.openai.com/v1'
              : 'https://generativelanguage.googleapis.com/v1beta/openai/',
            apiKey,
          },
          expectedGenerateOptions: isOpenAi
            ? { providerOptions: { openai: { reasoningEffort: 'low' } } }
            : {},
        }
      }),
    ),
  )('routes $provider $modelType models in dev', ({
    env,
    expectedGenerateOptions,
    expectedModel,
    localModelEnvKey,
  }) => {
    const agent = new TestMastraAgent(createEnvProvider(env), localModelEnvKey)

    expect(agent.model).toEqual(expectedModel)
    expect(agent.getDefaultGenerateOptionsLegacy()).toEqual(expectedGenerateOptions)
  })

  it.each([
    'stg',
    'prod',
  ] as const)('keeps OpenRouter in %s even when AI_PROVIDER selects OpenAI', (mode) => {
    const agent = new TestMastraAgent(
      createEnvProvider({
        HMS_SERVER_APP_MODE: mode,
        AI_PROVIDER: 'openai',
        OPENAI_API_KEY: 'openai-test-key',
        OPENAI_AI_MODEL: 'openai-test-model',
        OPENROUTER_API_KEY: 'openrouter-test-key',
      }),
    )

    expect(agent.model).toEqual({
      providerId: 'openrouter',
      modelId: 'deepseek/test-model',
      apiKey: 'openrouter-test-key',
    })
    expect(agent.getDefaultGenerateOptionsLegacy()).toEqual({})
  })

  it.each([
    ['openai', 'OPENAI_API_KEY'],
    ['gemini', 'GEMINI_API_KEY'],
  ] as const)('requires the %s credential in dev', (provider) => {
    expect(
      () =>
        new TestMastraAgent(
          createEnvProvider({
            HMS_SERVER_APP_MODE: 'dev',
            AI_PROVIDER: provider,
          }),
        ),
    ).toThrow(AppError)
  })

  it.each([
    ['openai', false],
    ['openai', true],
    ['gemini', false],
    ['gemini', true],
  ] as const)('requires the %s model ID in dev (vision: %s)', (provider, isVision) => {
    expect(
      () =>
        new TestMastraAgent(
          createEnvProvider({
            HMS_SERVER_APP_MODE: 'dev',
            AI_PROVIDER: provider,
            OPENAI_API_KEY: 'openai-test-key',
            GEMINI_API_KEY: 'gemini-test-key',
          }),
          isVision ? 'OLLAMA_VISION_AI_MODEL' : undefined,
        ),
    ).toThrow(AppError)
  })
})

class TestMastraAgent extends MastraAgent<'test-agent'> {
  constructor(
    envProvider: EnvProvider,
    localModelEnvKey?: 'OLLAMA_AI_MODEL' | 'OLLAMA_VISION_AI_MODEL',
  ) {
    super(
      {
        id: 'test-agent',
        name: 'Test Agent',
        instructions: 'Test only',
        model: 'deepseek/test-model',
        localModelEnvKey,
      },
      envProvider,
    )
  }
}

function createEnvProvider(values: Record<string, string>): EnvProvider {
  return {
    get(key) {
      return values[key]
    },
  } as EnvProvider
}
