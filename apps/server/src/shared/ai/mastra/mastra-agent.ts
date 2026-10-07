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
  readonly vision?: boolean
}

export abstract class MastraAgent<
  AgentId extends string,
> extends NativeMastraAgent<AgentId> {
  constructor(config: Config<AgentId>, envProvider: EnvProvider) {
    const { model, developmentModels, productionModels, vision, ...agentConfig } = config

    super({
      ...agentConfig,
      model: MastraAgent.resolveModel(
        model,
        envProvider,
        vision,
        developmentModels,
        productionModels,
        config.id,
      ),
    })
  }

  private static resolveModel(
    openRouterModel: string,
    envProvider: EnvProvider,
    vision = false,
    developmentModels?: readonly [string, ...string[]],
    productionModels?: Config<string>['productionModels'],
    agentId = 'unknown',
  ): OpenAICompatibleConfig | ModelWithRetries[] {
    const isDevelopment = envProvider.get('HMS_SERVER_APP_MODE') === 'dev'
    const aiProvider = isDevelopment ? envProvider.get('AI_PROVIDER') : 'openrouter'

    if (isDevelopment && aiProvider === 'gemini') {
      return MastraAgent.resolveExternalModel(
        'gemini',
        vision
          ? envProvider.get('GEMINI_VISION_AI_MODEL')
          : envProvider.get('GEMINI_AI_MODEL'),
        envProvider.get('GEMINI_API_KEY'),
        'https://generativelanguage.googleapis.com/v1beta/openai/',
      )
    }

    if (aiProvider !== 'openrouter') {
      throw new AppError(
        'O provedor de IA configurado não é suportado.',
        'Erro de Configuração de IA',
      )
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
    providerId: 'gemini',
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
