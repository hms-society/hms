import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { AiSuggestionsRepository } from '../../interfaces/ai-suggestions-repository'
import type { DatetimeProvider } from '../../interfaces/datetime-provider'
import type { AiSuggestion } from '../../domain/structures/ai-suggestion'
import { RegisterAiFeedbackUseCase } from '../register-ai-feedback-use-case'

describe('Register AI Feedback Use Case', () => {
  let repository: MockProxy<AiSuggestionsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  const fixedDate = new Date('2026-08-14T12:00:00Z')

  beforeEach(() => {
    repository = mock<AiSuggestionsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(fixedDate)
  })

  const fakeSuggestion: AiSuggestion = {
    id: 'sug-123',
    entityId: 'ent-456',
    entityType: 'consultation',
    suggestionType: 'legal_argument',
    content: 'Sugestão inicial',
    confidence: 'high',
    status: 'pending',
    suggestedAt: new Date(),
  }

  it('fails when suggestion does not exist', async () => {
    repository.findById.mockResolvedValue(null)
    const useCase = new RegisterAiFeedbackUseCase(repository, datetimeProvider)

    await expect(
      useCase.execute({
        suggestionId: 'sug-nonexistent',
        action: 'accept',
        collaboratorId: 'user-789',
      }),
    ).rejects.toThrow('Sugestão de IA não encontrada: sug-nonexistent')
  })

  it('successfully registers an accept action', async () => {
    repository.findById.mockResolvedValue(fakeSuggestion)
    const updatedSuggestion: AiSuggestion = { ...fakeSuggestion, status: 'accepted' }
    repository.updateFeedback.mockResolvedValue(updatedSuggestion)

    const useCase = new RegisterAiFeedbackUseCase(repository, datetimeProvider)
    const result = await useCase.execute({
      suggestionId: 'sug-123',
      action: 'accept',
      collaboratorId: 'user-789',
    })

    expect(result.status).toBe('accepted')
    expect(repository.updateFeedback).toHaveBeenCalledWith({
      id: 'sug-123',
      status: 'accepted',
      adjustedContent: undefined,
      rejectionReason: undefined,
      reviewedByCollaboratorId: 'user-789',
      reviewedAt: fixedDate,
    })
  })

  it('fails when adjust action has no adjusted content', async () => {
    repository.findById.mockResolvedValue(fakeSuggestion)
    const useCase = new RegisterAiFeedbackUseCase(repository, datetimeProvider)

    await expect(
      useCase.execute({
        suggestionId: 'sug-123',
        action: 'adjust',
        collaboratorId: 'user-789',
      }),
    ).rejects.toThrow('Conteúdo ajustado é obrigatório para a ação de ajuste.')
  })

  it('successfully registers an adjust action', async () => {
    repository.findById.mockResolvedValue(fakeSuggestion)
    const updatedSuggestion: AiSuggestion = {
      ...fakeSuggestion,
      status: 'adjusted',
      adjustedContent: 'Conteúdo corrigido',
    }
    repository.updateFeedback.mockResolvedValue(updatedSuggestion)

    const useCase = new RegisterAiFeedbackUseCase(repository, datetimeProvider)
    const result = await useCase.execute({
      suggestionId: 'sug-123',
      action: 'adjust',
      adjustedContent: 'Conteúdo corrigido',
      collaboratorId: 'user-789',
    })

    expect(result.status).toBe('adjusted')
    expect(result.adjustedContent).toBe('Conteúdo corrigido')
    expect(repository.updateFeedback).toHaveBeenCalledWith({
      id: 'sug-123',
      status: 'adjusted',
      adjustedContent: 'Conteúdo corrigido',
      rejectionReason: undefined,
      reviewedByCollaboratorId: 'user-789',
      reviewedAt: fixedDate,
    })
  })

  it('fails when reject action has no rejection reason', async () => {
    repository.findById.mockResolvedValue(fakeSuggestion)
    const useCase = new RegisterAiFeedbackUseCase(repository, datetimeProvider)

    await expect(
      useCase.execute({
        suggestionId: 'sug-123',
        action: 'reject',
        collaboratorId: 'user-789',
      }),
    ).rejects.toThrow('Motivo da rejeição é obrigatório.')
  })

  it('successfully registers a reject action and creates error log', async () => {
    repository.findById.mockResolvedValue(fakeSuggestion)
    const updatedSuggestion: AiSuggestion = {
      ...fakeSuggestion,
      status: 'rejected',
      rejectionReason: 'Não faz sentido legal',
    }
    repository.updateFeedback.mockResolvedValue(updatedSuggestion)

    const useCase = new RegisterAiFeedbackUseCase(repository, datetimeProvider)
    const result = await useCase.execute({
      suggestionId: 'sug-123',
      action: 'reject',
      rejectionReason: 'Não faz sentido legal',
      collaboratorId: 'user-789',
    })

    expect(result.status).toBe('rejected')
    expect(repository.updateFeedback).toHaveBeenCalledWith({
      id: 'sug-123',
      status: 'rejected',
      adjustedContent: undefined,
      rejectionReason: 'Não faz sentido legal',
      reviewedByCollaboratorId: 'user-789',
      reviewedAt: fixedDate,
    })
    expect(repository.createErrorLog).toHaveBeenCalledWith({
      suggestionId: 'sug-123',
      entityId: 'ent-456',
      suggestionType: 'legal_argument',
      suggestedContent: 'Sugestão inicial',
      rejectionReason: 'Não faz sentido legal',
      createdByCollaboratorId: 'user-789',
      createdAt: fixedDate,
    })
  })

  it('successfully registers a block action and creates a block rule', async () => {
    repository.findById.mockResolvedValue(fakeSuggestion)
    const updatedSuggestion: AiSuggestion = { ...fakeSuggestion, status: 'blocked' }
    repository.updateFeedback.mockResolvedValue(updatedSuggestion)

    const useCase = new RegisterAiFeedbackUseCase(repository, datetimeProvider)
    const result = await useCase.execute({
      suggestionId: 'sug-123',
      action: 'block',
      collaboratorId: 'user-789',
    })

    expect(result.status).toBe('blocked')
    expect(repository.updateFeedback).toHaveBeenCalledWith({
      id: 'sug-123',
      status: 'blocked',
      adjustedContent: undefined,
      rejectionReason: undefined,
      reviewedByCollaboratorId: 'user-789',
      reviewedAt: fixedDate,
    })
    expect(repository.createBlockRule).toHaveBeenCalledWith({
      suggestionId: 'sug-123',
      entityId: 'ent-456',
      suggestionType: 'legal_argument',
      blockedByCollaboratorId: 'user-789',
      blockedAt: fixedDate,
      isUnblocked: false,
    })
  })
})
