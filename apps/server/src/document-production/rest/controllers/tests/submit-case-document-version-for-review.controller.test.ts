import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import { DocumentVersionFaker } from '@hms/core/document-production/domain/entities/fakers'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { DrizzleDocumentVersionsRepository } from '@/document-production/database/drizzle/repositories'
import { SubmitCaseDocumentVersionForReviewController } from '@/document-production/rest/controllers/submit-case-document-version-for-review.controller'
import { DrizzleCaseMembersRepository } from '@/case-management/database/drizzle/repositories'

describe('Submit Case Document Version For Review Controller [PATCH /cases/:caseId/documents/:documentId/versions/:versionId/submit-review]', () => {
  let fixture: CaseManagementModuleFixture
  let versionsRepository: DrizzleDocumentVersionsRepository

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(
      SubmitCaseDocumentVersionForReviewController,
      (builder) => builder,
      [DocumentProductionDatabaseModule],
    )
    versionsRepository = fixture.app.get(DrizzleDocumentVersionsRepository)
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('denies submitting a version after its creator is removed from the case', async () => {
    const collaborator = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: collaborator.clientId,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
    })
    const [membership] = await fixture.registerCaseMembers([
      {
        caseId: legalCase.id,
        collaboratorId: collaborator.collaboratorId,
        role: CaseMemberRole.Collaborator,
      },
    ])
    if (!membership) throw new Error('Case membership fixture was not created')
    const version = await versionsRepository.add(
      DocumentVersionFaker.fake({
        createdByCollaboratorId: collaborator.collaboratorId,
        status: 'draft',
      }),
    )
    await fixture.app.get(DrizzleCaseMembersRepository).replace(membership.id, {
      removedAt: new Date('2026-10-09T00:00:00.000Z'),
      removedBy: fixture.authUser.id,
    })

    await request(fixture.app.getHttpServer())
      .patch(
        '/cases/' +
          legalCase.id +
          '/documents/' +
          version.documentId +
          '/versions/' +
          version.id +
          '/submit-review',
      )
      .expect(403)

    expect(await versionsRepository.findById(version.id)).toMatchObject({
      status: 'draft',
    })
  })
})
