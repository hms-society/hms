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

  it('routes text agents to the OpenAI generative model with low reasoning effort in dev', () => {
    const agent = new TestMastraAgent(
      createEnvProvider({
        HMS_SERVER_APP_MODE: 'dev',
        AI_PROVIDER: 'openai',
        OPENAI_API_KEY: 'openai-test-key',
        OPENAI_AI_MODEL: 'openai-generative-model',
        OPENAI_VISION_AI_MODEL: 'openai-vision-model',
      }),
    )

    expect(agent.model).toEqual({
      providerId: 'openai',
      modelId: 'openai-generative-model',
      url: 'https://api.openai.com/v1',
      apiKey: 'openai-test-key',
    })
    expect(agent.getDefaultGenerateOptionsLegacy()).toMatchObject({
      providerOptions: { openai: { reasoningEffort: 'low' } },
    })
  })

  it('routes vision agents to the OpenAI vision model with low reasoning effort in dev', () => {
    const agent = new TestMastraAgent(
      createEnvProvider({
        HMS_SERVER_APP_MODE: 'dev',
        AI_PROVIDER: 'openai',
        OPENAI_API_KEY: 'openai-test-key',
        OPENAI_AI_MODEL: 'openai-generative-model',
        OPENAI_VISION_AI_MODEL: 'openai-vision-model',
      }),
      'OLLAMA_VISION_AI_MODEL',
    )

    expect(agent.model).toEqual({
      providerId: 'openai',
      modelId: 'openai-vision-model',
      url: 'https://api.openai.com/v1',
      apiKey: 'openai-test-key',
    })
    expect(agent.getDefaultGenerateOptionsLegacy()).toMatchObject({
      providerOptions: { openai: { reasoningEffort: 'low' } },
    })
  })

  it('routes text agents to the Gemini generative model in dev', () => {
    const agent = new TestMastraAgent(
      createEnvProvider({
        HMS_SERVER_APP_MODE: 'dev',
        AI_PROVIDER: 'gemini',
        GEMINI_API_KEY: 'gemini-test-key',
        GEMINI_AI_MODEL: 'gemini-generative-model',
        GEMINI_VISION_AI_MODEL: 'gemini-vision-model',
      }),
    )

    expect(agent.model).toEqual({
      providerId: 'gemini',
      modelId: 'gemini-generative-model',
      url: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      apiKey: 'gemini-test-key',
    })
    expect(agent.getDefaultGenerateOptionsLegacy()).toEqual({})
  })

  it('routes vision agents to the Gemini vision model in dev', () => {
    const agent = new TestMastraAgent(
      createEnvProvider({
        HMS_SERVER_APP_MODE: 'dev',
        AI_PROVIDER: 'gemini',
        GEMINI_API_KEY: 'gemini-test-key',
        GEMINI_AI_MODEL: 'gemini-generative-model',
        GEMINI_VISION_AI_MODEL: 'gemini-vision-model',
      }),
      'OLLAMA_VISION_AI_MODEL',
    )

    expect(agent.model).toEqual({
      providerId: 'gemini',
      modelId: 'gemini-vision-model',
      url: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      apiKey: 'gemini-test-key',
    })
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
