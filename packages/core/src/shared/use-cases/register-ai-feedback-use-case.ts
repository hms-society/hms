import type { UseCase } from '../interfaces/use-case'
import type { DatetimeProvider } from '../interfaces/datetime-provider'
import type { AiSuggestionsRepository } from '../interfaces/ai-suggestions-repository'
import type { AiSuggestion } from '../domain/structures/ai-suggestion'
import { AiSuggestionStatus } from '../domain/structures/ai-suggestion-status'

export type RegisterAiFeedbackRequest = {
  suggestionId: string
  action: 'accept' | 'adjust' | 'reject' | 'block'
  adjustedContent?: string
  rejectionReason?: string
  collaboratorId: string
}

export class RegisterAiFeedbackUseCase
  implements UseCase<RegisterAiFeedbackRequest, AiSuggestion>
{
  constructor(
    private readonly aiSuggestionsRepository: AiSuggestionsRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: RegisterAiFeedbackRequest): Promise<AiSuggestion> {
    const existing = await this.aiSuggestionsRepository.findById(request.suggestionId)
    if (!existing) {
      throw new Error(`Sugestão de IA não encontrada: ${request.suggestionId}`)
    }

    const reviewedAt = this.datetimeProvider.now()
    let status: AiSuggestionStatus = AiSuggestionStatus.Accepted

    if (request.action === 'accept') {
      status = AiSuggestionStatus.Accepted
    } else if (request.action === 'adjust') {
      if (!request.adjustedContent) {
        throw new Error('Conteúdo ajustado é obrigatório para a ação de ajuste.')
      }
      status = AiSuggestionStatus.Adjusted
    } else if (request.action === 'reject') {
      if (!request.rejectionReason?.trim()) {
        throw new Error('Motivo da rejeição é obrigatório.')
      }
      status = AiSuggestionStatus.Rejected
    } else if (request.action === 'block') {
      status = AiSuggestionStatus.Blocked
    }

    const updated = await this.aiSuggestionsRepository.updateFeedback({
      id: request.suggestionId,
      status,
      adjustedContent: request.adjustedContent,
      rejectionReason: request.rejectionReason,
      reviewedByCollaboratorId: request.collaboratorId,
      reviewedAt,
    })

    if (request.action === 'reject') {
      await this.aiSuggestionsRepository.createErrorLog({
        suggestionId: existing.id,
        entityId: existing.entityId,
        suggestionType: existing.suggestionType,
        suggestedContent: existing.content,
        rejectionReason: request.rejectionReason ?? '',
        createdByCollaboratorId: request.collaboratorId,
        createdAt: reviewedAt,
      })
    }

    if (request.action === 'block') {
      await this.aiSuggestionsRepository.createBlockRule({
        suggestionId: existing.id,
        entityId: existing.entityId,
        suggestionType: existing.suggestionType,
        blockedByCollaboratorId: request.collaboratorId,
        blockedAt: reviewedAt,
        isUnblocked: false,
      })
    }

    return updated
  }
}
