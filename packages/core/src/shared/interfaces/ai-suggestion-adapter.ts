import type { AiSuggestion } from '../domain/structures/ai-suggestion'

export interface AiSuggestionAdapter<TSource> {
  adapt(source: TSource): AiSuggestion
}
