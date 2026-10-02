import { Agent as NativeMastraAgent } from '@mastra/core/agent'
import type { ModelWithRetries } from '@mastra/core/agent'
import type { OpenAICompatibleConfig } from '@mastra/core/llm'
import { AppError } from '@hms/core/shared/domain/errors'

import { EnvProvider } from '@/shared/provision/env/env-provider'
import { ObservedMastraModel } from '@/shared/ai/mastra/observed-mastra-model'

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
        config.id,
      ),
      ...(!developmentModels &&
        MastraAgent.usesOpenAiWithLowReasoningEffort(envProvider) && {
          defaultGenerateOptionsLegacy: {
            providerOptions: { openai: { reasoningEffort: 'low' } },
          },
        }),
    })
  }

  private static usesOpenAiWithLowReasoningEffort(envProvider: EnvProvider): boolean {
    return (
      envProvider.get('HMS_SERVER_APP_MODE') === 'dev' &&
      envProvider.get('AI_PROVIDER') === 'openai'
    )
  }

  private static resolveModel(
    openRouterModel: string,
    envProvider: EnvProvider,
    localModelEnvKey: 'OLLAMA_AI_MODEL' | 'OLLAMA_VISION_AI_MODEL' = 'OLLAMA_AI_MODEL',
    developmentModels?: readonly [string, ...string[]],
    productionModels?: Config<string>['productionModels'],
    agentId = 'unknown',
  ): OpenAICompatibleConfig | ModelWithRetries[] {
    const isDevelopment = envProvider.get('HMS_SERVER_APP_MODE') === 'dev'

    if (isDevelopment && !developmentModels) {
      const aiProvider = envProvider.get('AI_PROVIDER')
      const usesVisionModel = localModelEnvKey === 'OLLAMA_VISION_AI_MODEL'

      if (aiProvider === 'openai') {
        return MastraAgent.resolveExternalModel(
          'openai',
          usesVisionModel
            ? envProvider.get('OPENAI_VISION_AI_MODEL')
            : envProvider.get('OPENAI_AI_MODEL'),
          envProvider.get('OPENAI_API_KEY'),
          'https://api.openai.com/v1',
        )
      }

      if (aiProvider === 'gemini') {
        return MastraAgent.resolveExternalModel(
          'gemini',
          usesVisionModel
            ? envProvider.get('GEMINI_VISION_AI_MODEL')
            : envProvider.get('GEMINI_AI_MODEL'),
          envProvider.get('GEMINI_API_KEY'),
          'https://generativelanguage.googleapis.com/v1beta/openai/',
        )
      }

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
      return developmentModels.map((modelId, routeIndex) => ({
        model: envProvider.get('OTEL_EXPORTER_OTLP_ENDPOINT')
          ? new ObservedMastraModel(
              { providerId: 'openrouter', modelId, apiKey },
              agentId,
              routeIndex,
            )
          : { providerId: 'openrouter', modelId, apiKey },
        maxRetries: 0,
      }))
    }

    if (envProvider.get('HMS_SERVER_APP_MODE') === 'prod' && productionModels) {
      return productionModels.map(({ model: modelId, provider }, routeIndex) => ({
        model: envProvider.get('OTEL_EXPORTER_OTLP_ENDPOINT')
          ? new ObservedMastraModel(
              { providerId: 'openrouter', modelId, apiKey },
              agentId,
              routeIndex,
              provider,
            )
          : { providerId: 'openrouter', modelId, apiKey },
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

    const model = {
      providerId: 'openrouter',
      modelId: openRouterModel,
      apiKey,
    }
    return envProvider.get('OTEL_EXPORTER_OTLP_ENDPOINT')
      ? [{ model: new ObservedMastraModel(model, agentId, 0) }]
      : model
  }

  private static resolveExternalModel(
    providerId: 'openai' | 'gemini',
    modelId: string | undefined,
    apiKey: string | undefined,
    url: string,
  ): OpenAICompatibleConfig {
    if (!apiKey) {
      throw new AppError(
        `Configure a credencial do ${providerId} para usar esse provedor em desenvolvimento.`,
        'Erro de Configuração de IA',
      )
    }

    if (!modelId) {
      throw new AppError(
        `Configure o ID do modelo do ${providerId} para usar esse provedor em desenvolvimento.`,
        'Erro de Configuração de IA',
      )
    }

    return { providerId, modelId, url, apiKey }
  }
}
