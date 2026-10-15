import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import type { LegalExpertise } from '@hms/core/identity/domain/structures'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { GetCollaboratorProfessionalProfileController } from '@/identity/rest/controllers/get-collaborator-professional-profile.controller'

const AUTHORIZED_PROFILES = ['admin', 'lawyer', 'paralegal', 'supervisor'] as const
const UNAUTHORIZED_PROFILES = ['attendant', 'intern', 'client'] as const
const INACTIVE_ACTORS = AUTHORIZED_PROFILES.flatMap((profile) =>
  (['disabled', 'invited'] as const).map((status) => ({ profile, status })),
)

describe('Get Collaborator Professional Profile Controller [GET /collaborators/:collaboratorId/professional-profile]', () => {
  let fixture: IdentityModuleFixture
  let legalExpertises: LegalExpertise[]
  let targetId: string
  let expectedProfile: Record<string, unknown>

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(
      GetCollaboratorProfessionalProfileController,
    )
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
    const { areas, topics } = await fixture.seedLegalCatalog()
    const legalArea = areas[0]
    const legalTopic = topics.find((topic) => topic.legalAreaId === legalArea?.id)
    if (!legalArea || !legalTopic) throw new Error('Legal catalog fixture is missing')
    legalExpertises = [{ legalAreaId: legalArea.id, legalTopicIds: [legalTopic.id] }]
    const user = await fixture.registerUser({ lastAccessAt: new Date('2026-09-01') })
    const target = await fixture.registerCollaborator(user, {
      profile: 'lawyer',
      professionalName: 'Maria Oliveira',
      jobTitle: 'Advogada sênior',
      legalExpertises,
    })
    targetId = target.id
    expectedProfile = {
      collaboratorId: target.id,
      professionalName: 'Maria Oliveira',
      email: user.email,
      profile: 'lawyer',
      legalExpertises: [
        {
          legalArea: { id: legalArea.id, name: legalArea.name, active: legalArea.active },
          legalTopics: [
            { id: legalTopic.id, name: legalTopic.name, active: legalTopic.active },
          ],
        },
      ],
    }
  })

  afterAll(async () => fixture?.close())

  it.each(
    AUTHORIZED_PROFILES,
  )('returns only professional fields to an active %s', async (profile) => {
    const actor = await fixture.registerUser()
    await fixture.registerCollaborator(actor, { profile, legalExpertises })
    const response = await request(fixture.app.getHttpServer())
      .get(`/collaborators/${targetId}/professional-profile`)
      .set('Authorization', fixture.authenticateAs(actor))
      .expect(200)

    expect(response.body).toEqual(expectedProfile)
    expect(Object.keys(response.body).sort()).toEqual([
      'collaboratorId',
      'email',
      'legalExpertises',
      'professionalName',
      'profile',
    ])
  })

  it.each(UNAUTHORIZED_PROFILES)('denies an active %s', async (profile) => {
    const actor = await fixture.registerUser()
    await fixture.registerCollaborator(actor, { profile, legalExpertises })
    await request(fixture.app.getHttpServer())
      .get(`/collaborators/${targetId}/professional-profile`)
      .set('Authorization', fixture.authenticateAs(actor))
      .expect(403)
  })

  it.each(INACTIVE_ACTORS)('denies a $status $profile', async ({ profile, status }) => {
    const actor = await fixture.registerUser({ status })
    await fixture.registerCollaborator(actor, { profile, legalExpertises })
    await request(fixture.app.getHttpServer())
      .get(`/collaborators/${targetId}/professional-profile`)
      .set('Authorization', fixture.authenticateAs(actor))
      .expect(status === 'disabled' ? 401 : 403)
  })

  it('requires an authenticated session', async () => {
    await request(fixture.app.getHttpServer())
      .get(`/collaborators/${targetId}/professional-profile`)
      .expect(401)
  })

  it('returns not found for an unknown collaborator', async () => {
    const { user: admin } = await fixture.registerAdmin()
    await request(fixture.app.getHttpServer())
      .get(`/collaborators/${randomUUID()}/professional-profile`)
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(404)
  })

  it('rejects an invalid collaborator identifier', async () => {
    const { user: admin } = await fixture.registerAdmin()
    await request(fixture.app.getHttpServer())
      .get('/collaborators/invalid/professional-profile')
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(400)
  })
})
