import type { UseCase } from '../interfaces/use-case'
import type { AiSuggestion } from '../domain/structures/ai-suggestion'
import type { AiSuggestionsRepository } from '../interfaces/ai-suggestions-repository'

type GetAiSuggestionsRequest = {
  entityId: string
}

export class GetAiSuggestionsUseCase
  implements UseCase<GetAiSuggestionsRequest, AiSuggestion[]>
{
  constructor(private readonly aiSuggestionsRepository: AiSuggestionsRepository) {}

  async execute({ entityId }: GetAiSuggestionsRequest): Promise<AiSuggestion[]> {
    return this.aiSuggestionsRepository.findByEntityId(entityId)
  }
}
