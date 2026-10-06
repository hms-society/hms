import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import type { DynamicFormsRepository } from '@hms/core/shared/interfaces'
import type { UsersRepository } from '@hms/core/identity/interfaces'

import { AuthModule } from '@/identity/auth.module'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { DYNAMIC_FORMS_REPOSITORIES } from '@/shared/constants/dynamic-forms-repositories'
import { SharedRestModule } from '@/shared/rest/rest.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { SupabaseAuthFixture } from '@/shared/rest/tests/supabase-auth-fixture'

describe('List Dynamic Forms Controller [GET /dynamic-forms]', () => {
  let fixture: RestFixture
  let authFixture: SupabaseAuthFixture
  beforeAll(async () => {
    authFixture = await SupabaseAuthFixture.register()
    try {
      fixture = await RestFixture.register(
        { imports: [SharedRestModule, AuthModule] },
        (builder) => authFixture.configure(builder),
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

  it('filters persisted forms by legal context', async () => {
    const auth = await authFixture.createSignedInUser()
    const users = fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users)
    await users.addMany([
      { id: auth.user.id, email: auth.user.email ?? '', status: 'active' },
    ])
    const forms = fixture.get<DynamicFormsRepository>(
      DYNAMIC_FORMS_REPOSITORIES.dynamicForms,
    )
    const legalAreaId = randomUUID()
    const legalTopicId = randomUUID()
    const [form] = await forms.addMany([
      {
        id: randomUUID(),
        name: 'Triagem Cível',
        status: 'available',
        contexts: [
          { type: 'legal', data: { legalAreaId, legalTopicIds: [legalTopicId] } },
        ],
        fields: [],
      },
    ])
    const response = await request(fixture.app.getHttpServer())
      .get('/dynamic-forms')
      .query({ legalAreaId, legalTopicId })
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .expect(200)
    expect(response.body).toEqual([
      expect.objectContaining({ id: form.id, name: 'Triagem Cível' }),
    ])
  })

  it('requires authentication', async () => {
    await request(fixture.app.getHttpServer()).get('/dynamic-forms').expect(401)
  })
})
