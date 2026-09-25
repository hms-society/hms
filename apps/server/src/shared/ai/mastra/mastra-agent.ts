import { Agent as NativeMastraAgent } from '@mastra/core/agent'
import type { OpenAICompatibleConfig } from '@mastra/core/llm'
import { AppError } from '@hms/core/shared/domain/errors'

import { EnvProvider } from '@/shared/provision/env/env-provider'

type Config<AgentId extends string> = {
  readonly id: AgentId
  readonly name: string
  readonly instructions: string
  readonly model: string
  readonly localModelEnvKey?: 'OLLAMA_AI_MODEL' | 'OLLAMA_VISION_AI_MODEL'
}

export abstract class MastraAgent<
  AgentId extends string,
> extends NativeMastraAgent<AgentId> {
  constructor(config: Config<AgentId>, envProvider: EnvProvider) {
    const { model, ...agentConfig } = config

    super({
      ...agentConfig,
      model: MastraAgent.resolveModel(model, envProvider, config.localModelEnvKey),
      ...(MastraAgent.usesOpenAiWithLowReasoningEffort(envProvider) && {
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
  ): OpenAICompatibleConfig {
    if (envProvider.get('HMS_SERVER_APP_MODE') === 'dev') {
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
        'A credencial do OpenRouter é obrigatória em staging e produção.',
        'Erro de Configuração de IA',
      )
    }

    return {
      providerId: 'openrouter',
      modelId: openRouterModel,
      apiKey,
    }
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
