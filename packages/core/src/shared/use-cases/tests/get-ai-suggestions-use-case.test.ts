import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { AiSuggestionsRepository } from '../../interfaces/ai-suggestions-repository'
import type { AiSuggestion } from '../../domain/structures/ai-suggestion'
import { GetAiSuggestionsUseCase } from '../get-ai-suggestions-use-case'

describe('Get AI Suggestions Use Case', () => {
  let repository: MockProxy<AiSuggestionsRepository>

  beforeEach(() => {
    repository = mock<AiSuggestionsRepository>()
  })

  it('should return suggestions for the given entityId', async () => {
    const suggestions: AiSuggestion[] = [
      {
        id: 'suggestion-1',
        entityId: 'entity-123',
        entityType: 'consultation',
        suggestionType: 'legal_argument',
        content: 'Sugestão de teste 1',
        confidence: 'high',
        status: 'pending',
        suggestedAt: new Date(),
      },
      {
        id: 'suggestion-2',
        entityId: 'entity-123',
        entityType: 'consultation',
        suggestionType: 'legal_argument',
        content: 'Sugestão de teste 2',
        confidence: 'low',
        status: 'pending',
        suggestedAt: new Date(),
      },
    ]

    repository.findByEntityId.mockResolvedValue(suggestions)
    const useCase = new GetAiSuggestionsUseCase(repository)

    const result = await useCase.execute({ entityId: 'entity-123' })

    expect(result).toBe(suggestions)
    expect(repository.findByEntityId).toHaveBeenCalledWith('entity-123')
  })
})
