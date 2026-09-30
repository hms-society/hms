import { Agent as NativeMastraAgent } from '@mastra/core/agent'
import type { ModelWithRetries } from '@mastra/core/agent'
import type { OpenAICompatibleConfig } from '@mastra/core/llm'
import { AppError } from '@hms/core/shared/domain/errors'

import { EnvProvider } from '@/shared/provision/env/env-provider'

type Config<AgentId extends string> = {
  readonly id: AgentId
  readonly name: string
  readonly instructions: string
  readonly model: string
  readonly developmentModels?: readonly [string, ...string[]]
  readonly productionModels?: readonly [
    { readonly model: string; readonly provider: string },
    ...{ readonly model: string; readonly provider: string }[],
  ]
  readonly localModelEnvKey?: 'OLLAMA_AI_MODEL' | 'OLLAMA_VISION_AI_MODEL'
}

export abstract class MastraAgent<
  AgentId extends string,
> extends NativeMastraAgent<AgentId> {
  constructor(config: Config<AgentId>, envProvider: EnvProvider) {
    const {
      model,
      developmentModels,
      productionModels,
      localModelEnvKey,
      ...agentConfig
    } = config

    super({
      ...agentConfig,
      model: MastraAgent.resolveModel(
        model,
        envProvider,
        localModelEnvKey,
        developmentModels,
        productionModels,
      ),
    })
  }

  private static resolveModel(
    openRouterModel: string,
    envProvider: EnvProvider,
    localModelEnvKey: 'OLLAMA_AI_MODEL' | 'OLLAMA_VISION_AI_MODEL' = 'OLLAMA_AI_MODEL',
    developmentModels?: readonly [string, ...string[]],
    productionModels?: Config<string>['productionModels'],
  ): OpenAICompatibleConfig | ModelWithRetries[] {
    const isDevelopment = envProvider.get('HMS_SERVER_APP_MODE') === 'dev'

    if (isDevelopment && !developmentModels) {
      return {
        providerId: 'ollama',
        modelId: envProvider.get(localModelEnvKey),
        url: 'http://localhost:11434/v1',
        apiKey: 'ollama',
      }
    }

    const apiKey = envProvider.get('OPENROUTER_API_KEY')
    if (!apiKey) {
      throw new AppError(
        'A credencial do OpenRouter é obrigatória para os agentes configurados com OpenRouter.',
        'Erro de Configuração de IA',
      )
    }

    if (isDevelopment && developmentModels) {
      return developmentModels.map((modelId) => ({
        model: { providerId: 'openrouter', modelId, apiKey },
        maxRetries: 0,
      }))
    }

    if (envProvider.get('HMS_SERVER_APP_MODE') === 'prod' && productionModels) {
      return productionModels.map(({ model: modelId, provider }) => ({
        model: { providerId: 'openrouter', modelId, apiKey },
        maxRetries: 0,
        providerOptions: {
          openrouter: {
            provider: {
              only: [provider],
              allow_fallbacks: false,
              require_parameters: true,
            },
          },
        },
      }))
    }

    return {
      providerId: 'openrouter',
      modelId: openRouterModel,
      apiKey,
    }
  }
}
