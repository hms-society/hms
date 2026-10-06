import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { AiSuggestionStatus } from '@hms/core/shared/domain/structures'
import type { AiSuggestionsRepository } from '@hms/core/shared/interfaces'
import type {
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import { CollaboratorCreationFaker } from '@hms/core/identity/domain/entities/fakers'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { AI_SUGGESTIONS_REPOSITORIES } from '@/shared/constants/ai-suggestions-repositories'
import { SharedRestModule } from '@/shared/rest/rest.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { SupabaseAuthFixture } from '@/shared/rest/tests/supabase-auth-fixture'

describe('Ai Suggestions Controller [GET /ai-suggestions, POST /ai-suggestions/:id/feedback]', () => {
  let fixture: RestFixture
  let authFixture: SupabaseAuthFixture

  beforeAll(async () => {
    authFixture = await SupabaseAuthFixture.register()
    try {
      fixture = await RestFixture.register({ imports: [SharedRestModule] }, (builder) =>
        authFixture.configure(builder),
      )
    } catch (error) {
      await authFixture.close()
      throw error
    }
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => {
    try {
      await fixture?.close()
    } finally {
      await authFixture?.close()
    }
  })

  it('requires authentication for both routes', async () => {
    await request(fixture.app.getHttpServer())
      .get('/ai-suggestions')
      .query({ entityId: randomUUID() })
      .expect(401)

    await request(fixture.app.getHttpServer())
      .post(`/ai-suggestions/${randomUUID()}/feedback`)
      .send({ action: 'accept' })
      .expect(401)
  })

  it('requires an active collaborator', async () => {
    const auth = await authFixture.createSignedInUser()
    const users = fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users)
    await users.addMany([
      { id: auth.user.id, email: auth.user.email ?? '', status: 'active' },
    ])

    await request(fixture.app.getHttpServer())
      .get('/ai-suggestions')
      .query({ entityId: randomUUID() })
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .expect(403)
  })

  it('returns suggestions for the requested entity from PostgreSQL', async () => {
    const { token } = await registerCollaborator()
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
      .set('Authorization', token)
      .expect(200)
    expect(response.body).toEqual([
      expect.objectContaining({ id: suggestion.id, content: 'Resumo sugerido' }),
    ])
  })

  it('records feedback and persists the review', async () => {
    const { collaborator, token } = await registerCollaborator()
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
    const response = await request(fixture.app.getHttpServer())
      .post(`/ai-suggestions/${suggestion.id}/feedback`)
      .set('Authorization', token)
      .send({ action: 'accept', collaboratorId: randomUUID() })
      .expect(200)
    expect(response.body).toMatchObject({
      id: suggestion.id,
      status: AiSuggestionStatus.Accepted,
    })
    expect(await repository.findById(suggestion.id)).toMatchObject({
      status: AiSuggestionStatus.Accepted,
      reviewedByCollaboratorId: collaborator.id,
    })
  })

  async function registerCollaborator() {
    const auth = await authFixture.createSignedInUser()
    const users = fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users)
    const collaborators = fixture.get<CollaboratorsRepository>(
      IDENTITY_REPOSITORIES.collaborators,
    )
    await users.addMany([
      { id: auth.user.id, email: auth.user.email ?? '', status: 'active' },
    ])
    const collaborator = await collaborators.add(
      CollaboratorCreationFaker.administrative({
        userId: auth.user.id,
        profile: 'attendant',
      }),
    )
    if (!collaborator) throw new Error('Test collaborator was not created')
    return { collaborator, token: `Bearer ${auth.accessToken}` }
  }
})
