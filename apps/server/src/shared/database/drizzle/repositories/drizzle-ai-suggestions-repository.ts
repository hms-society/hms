import { Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import type {
  AiSuggestionsRepository,
  UpdateAiFeedbackParams,
} from '@hms/core/shared/interfaces'
import type { AiSuggestion, AiSuggestionStatus } from '@hms/core/shared/domain/structures'
import type { AiError, AiBlock } from '@hms/core/shared/domain/entities'
import { aiSuggestionModel } from '../models/ai-suggestion-model'
import { aiErrorModel } from '../models/ai-error-model'
import { aiBlockModel } from '../models/ai-block-model'

@Injectable()
export class DrizzleAiSuggestionsRepository
  extends DrizzleRepository
  implements AiSuggestionsRepository
{
  async findByEntityId(entityId: string): Promise<AiSuggestion[]> {
    const rows = await this.database
      .select()
      .from(aiSuggestionModel)
      .where(eq(aiSuggestionModel.entityId, entityId))

    return rows.map((row) => this.toDomain(row))
  }

  async findById(id: string): Promise<AiSuggestion | null> {
    const rows = await this.database
      .select()
      .from(aiSuggestionModel)
      .where(eq(aiSuggestionModel.id, id))
      .limit(1)

    if (rows.length === 0) return null
    return this.toDomain(rows[0])
  }

  async add(suggestion: Omit<AiSuggestion, 'id'>): Promise<AiSuggestion> {
    const [row] = await this.database
      .insert(aiSuggestionModel)
      .values({
        entityId: suggestion.entityId,
        entityType: suggestion.entityType,
        suggestionType: suggestion.suggestionType,
        content: suggestion.content,
        confidence: suggestion.confidence ? String(suggestion.confidence) : undefined,
        status: suggestion.status,
        metadata: suggestion.metadata ?? null,
        suggestedAt: suggestion.suggestedAt,
      })
      .returning()

    return this.toDomain(row)
  }

  async updateFeedback(params: UpdateAiFeedbackParams): Promise<AiSuggestion> {
    const [row] = await this.database
      .update(aiSuggestionModel)
      .set({
        status: params.status,
        adjustedContent: params.adjustedContent ?? null,
        rejectionReason: params.rejectionReason ?? null,
        reviewedBy: params.reviewedByCollaboratorId,
        reviewedAt: params.reviewedAt,
        updatedAt: new Date(),
      })
      .where(eq(aiSuggestionModel.id, params.id))
      .returning()

    return this.toDomain(row)
  }

  async createErrorLog(error: Omit<AiError, 'id'>): Promise<AiError> {
    const [row] = await this.database
      .insert(aiErrorModel)
      .values({
        suggestionId: error.suggestionId,
        entityId: error.entityId,
        suggestionType: error.suggestionType,
        suggestedContent: error.suggestedContent,
        rejectionReason: error.rejectionReason,
        createdByCollaboratorId: error.createdByCollaboratorId,
        createdAt: error.createdAt,
      })
      .returning()

    return {
      id: row.id,
      suggestionId: row.suggestionId,
      entityId: row.entityId,
      suggestionType: row.suggestionType,
      suggestedContent: row.suggestedContent,
      rejectionReason: row.rejectionReason,
      createdByCollaboratorId: row.createdByCollaboratorId,
      createdAt: row.createdAt,
    }
  }

  async createBlockRule(block: Omit<AiBlock, 'id'>): Promise<AiBlock> {
    const [row] = await this.database
      .insert(aiBlockModel)
      .values({
        suggestionId: block.suggestionId,
        entityId: block.entityId,
        suggestionType: block.suggestionType,
        blockedByCollaboratorId: block.blockedByCollaboratorId,
        blockedAt: block.blockedAt,
        isUnblocked: block.isUnblocked,
      })
      .returning()

    return {
      id: row.id,
      suggestionId: row.suggestionId,
      entityId: row.entityId,
      suggestionType: row.suggestionType,
      blockedByCollaboratorId: row.blockedByCollaboratorId,
      blockedAt: row.blockedAt,
      isUnblocked: row.isUnblocked,
    }
  }

  private toDomain(row: typeof aiSuggestionModel.$inferSelect): AiSuggestion {
    return {
      id: row.id,
      entityId: row.entityId,
      entityType: row.entityType,
      suggestionType: row.suggestionType,
      content: row.content,
      adjustedContent: row.adjustedContent ?? undefined,
      rejectionReason: row.rejectionReason ?? undefined,
      confidence: (row.confidence as 'high' | 'low') ?? undefined,
      status: row.status as AiSuggestionStatus,
      reviewedAt: row.reviewedAt ?? undefined,
      reviewedByCollaboratorId: row.reviewedBy ?? undefined,
      suggestedAt: row.suggestedAt,
      metadata: (row.metadata as Record<string, unknown>) ?? undefined,
    }
  }
}
