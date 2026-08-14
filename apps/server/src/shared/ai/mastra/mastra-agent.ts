import { Agent as NativeMastraAgent } from '@mastra/core/agent'
import type { OpenAICompatibleConfig } from '@mastra/core/llm'
import { AppError } from '@hms/core/shared/domain/errors'

import { EnvProvider } from '@/shared/provision/env/env-provider'

type Config<AgentId extends string> = {
  readonly id: AgentId
  readonly name: string
  readonly instructions: string
  readonly model: string
}

export abstract class MastraAgent<
  AgentId extends string,
> extends NativeMastraAgent<AgentId> {
  constructor(config: Config<AgentId>, envProvider: EnvProvider) {
    const { model, ...agentConfig } = config

    super({
      ...agentConfig,
      model: MastraAgent.resolveModel(model, envProvider),
    })
  }

  private static resolveModel(
    openRouterModel: string,
    envProvider: EnvProvider,
  ): OpenAICompatibleConfig {
    if (envProvider.get('HMS_SERVER_APP_MODE') === 'dev') {
      return {
        providerId: 'ollama',
        modelId: envProvider.get('OLLAMA_AI_MODEL'),
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
}
