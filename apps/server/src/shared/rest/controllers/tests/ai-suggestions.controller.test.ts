import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { AiSuggestionStatus } from '@hms/core/shared/domain/structures'
import type { AiSuggestionsRepository } from '@hms/core/shared/interfaces'

import { AI_SUGGESTIONS_REPOSITORIES } from '@/shared/constants/ai-suggestions-repositories'
import { SharedRestModule } from '@/shared/rest/rest.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

describe('Ai Suggestions Controller [GET /ai-suggestions, POST /ai-suggestions/:id/feedback]', () => {
  let fixture: RestFixture

  beforeAll(async () => {
    fixture = await RestFixture.register({ imports: [SharedRestModule] })
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('returns suggestions for the requested entity from PostgreSQL', async () => {
    const repository = fixture.get<AiSuggestionsRepository>(
      AI_SUGGESTIONS_REPOSITORIES.aiSuggestions,
    )
    const entityId = randomUUID()
    const suggestion = await repository.add({
      entityId,
      entityType: 'consultation',
      suggestionType: 'summary',
      content: 'Resumo sugerido',
      status: AiSuggestionStatus.Pending,
      suggestedAt: new Date(),
    })
    await repository.add({
      entityId: randomUUID(),
      entityType: 'consultation',
      suggestionType: 'summary',
      content: 'Outro resumo',
      status: AiSuggestionStatus.Pending,
      suggestedAt: new Date(),
    })

    const response = await request(fixture.app.getHttpServer())
      .get('/ai-suggestions')
      .query({ entityId })
      .expect(200)
    expect(response.body).toEqual([
      expect.objectContaining({ id: suggestion.id, content: 'Resumo sugerido' }),
    ])
  })

  it('records feedback and persists the review', async () => {
    const repository = fixture.get<AiSuggestionsRepository>(
      AI_SUGGESTIONS_REPOSITORIES.aiSuggestions,
    )
    const suggestion = await repository.add({
      entityId: randomUUID(),
      entityType: 'consultation',
      suggestionType: 'summary',
      content: 'Resumo sugerido',
      status: AiSuggestionStatus.Pending,
      suggestedAt: new Date(),
    })
    const collaboratorId = randomUUID()
    const response = await request(fixture.app.getHttpServer())
      .post(`/ai-suggestions/${suggestion.id}/feedback`)
      .send({ action: 'accept', collaboratorId })
      .expect(200)
    expect(response.body).toMatchObject({
      id: suggestion.id,
      status: AiSuggestionStatus.Accepted,
    })
    expect(await repository.findById(suggestion.id)).toMatchObject({
      status: AiSuggestionStatus.Accepted,
      reviewedByCollaboratorId: collaboratorId,
    })
  })
})
