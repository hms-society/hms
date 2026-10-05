import { describe, expect, it } from 'vitest'

import { AppError } from '@hms/core/shared/domain/errors'

import type { EnvProvider } from '@/shared/provision/env/env-provider'

import { MastraAgent } from './mastra-agent'

describe('MastraAgent model resolution', () => {
  it.each(
    (['gemini', 'openrouter'] as const).flatMap((provider) =>
      (['text', 'vision'] as const).map((modelType) => {
        const isVision = modelType === 'vision'
        const apiKey = `${provider}-test-key`
        const modelId = provider === 'openrouter'
          ? 'deepseek/test-model'
          : `${provider}-${isVision ? 'vision' : 'generative'}-model`

        return {
          provider,
          modelType,
          vision: isVision,
          env: {
            HMS_SERVER_APP_MODE: 'dev',
            AI_PROVIDER: provider,
            [provider === 'openrouter' ? 'OPENROUTER_API_KEY' : 'GEMINI_API_KEY']:
              apiKey,
            GEMINI_AI_MODEL: `${provider}-generative-model`,
            GEMINI_VISION_AI_MODEL: `${provider}-vision-model`,
          },
          expectedModel: {
            providerId: provider,
            modelId,
            ...(provider === 'gemini'
              ? { url: 'https://generativelanguage.googleapis.com/v1beta/openai/' }
              : {}),
            apiKey,
          },
          expectedGenerateOptions: {},
        }
      }),
    ),
  )('routes $provider $modelType models in dev', ({
    env,
    expectedGenerateOptions,
    expectedModel,
    vision,
  }) => {
    const agent = new TestMastraAgent(createEnvProvider(env), vision)

    expect(agent.model).toEqual(expectedModel)
    expect(agent.getDefaultGenerateOptionsLegacy()).toEqual(expectedGenerateOptions)
  })

  it.each([
    'stg',
    'prod',
  ] as const)('keeps OpenRouter in %s', (mode) => {
    const agent = new TestMastraAgent(
      createEnvProvider({
        HMS_SERVER_APP_MODE: mode,
        AI_PROVIDER: 'gemini',
        GEMINI_API_KEY: 'gemini-test-key',
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
    ['gemini', 'GEMINI_API_KEY'],
    ['openrouter', 'OPENROUTER_API_KEY'],
  ] as const)('requires the %s credential in dev', (provider, _credentialKey) => {
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
    ['gemini', false],
    ['gemini', true],
  ] as const)('requires the %s model ID in dev (vision: %s)', (provider, isVision) => {
    expect(
      () =>
        new TestMastraAgent(
          createEnvProvider({
            HMS_SERVER_APP_MODE: 'dev',
            AI_PROVIDER: provider,
            GEMINI_API_KEY: 'gemini-test-key',
          }),
          isVision,
        ),
    ).toThrow(AppError)
  })
})

class TestMastraAgent extends MastraAgent<'test-agent'> {
  constructor(
    envProvider: EnvProvider,
    vision = false,
  ) {
    super(
      {
        id: 'test-agent',
        name: 'Test Agent',
        instructions: 'Test only',
        model: 'deepseek/test-model',
        vision,
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
