import { Agent as NativeMastraAgent } from '@mastra/core/agent'
import type { OpenAICompatibleConfig } from '@mastra/core/llm'
import { AppError } from '@hms/core/shared/domain/errors'

import { EnvProvider } from '@/shared/provision/env/env-provider'

type Config<AgentId extends string> = {
  readonly id: AgentId
  readonly name: string
  readonly instructions: string
  readonly model: string
  readonly vision?: boolean
}

export abstract class MastraAgent<
  AgentId extends string,
> extends NativeMastraAgent<AgentId> {
  constructor(config: Config<AgentId>, envProvider: EnvProvider) {
    const { model, vision, ...agentConfig } = config

    super({
      ...agentConfig,
      model: MastraAgent.resolveModel(model, envProvider, vision),
    })
  }

  private static resolveModel(
    openRouterModel: string,
    envProvider: EnvProvider,
    vision = false,
  ): OpenAICompatibleConfig {
    if (envProvider.get('HMS_SERVER_APP_MODE') === 'dev') {
      const aiProvider = envProvider.get('AI_PROVIDER')
      const usesVisionModel = vision

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

      if (aiProvider === 'openrouter') {
        return MastraAgent.resolveOpenRouterModel(openRouterModel, envProvider)
      }

      throw new AppError(
        'O provedor de IA configurado não é suportado.',
        'Erro de Configuração de IA',
      )
    }

    return MastraAgent.resolveOpenRouterModel(openRouterModel, envProvider)
  }

  private static resolveOpenRouterModel(
    modelId: string,
    envProvider: EnvProvider,
  ): OpenAICompatibleConfig {
    const apiKey = envProvider.get('OPENROUTER_API_KEY')
    if (!apiKey) {
      throw new AppError(
        'A credencial do OpenRouter é obrigatória em staging e produção.',
        'Erro de Configuração de IA',
      )
    }

    return {
      providerId: 'openrouter',
      modelId,
      apiKey,
    }
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
