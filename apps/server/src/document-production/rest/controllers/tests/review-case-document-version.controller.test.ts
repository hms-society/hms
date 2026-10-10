import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import { DocumentVersionFaker } from '@hms/core/document-production/domain/entities/fakers'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { DrizzleDocumentVersionsRepository } from '@/document-production/database/drizzle/repositories'
import { ReviewCaseDocumentVersionController } from '@/document-production/rest/controllers/review-case-document-version.controller'

describe('Review Case Document Version Controller [PATCH /cases/:caseId/documents/:documentId/versions/:versionId/review]', () => {
  let fixture: CaseManagementModuleFixture
  let versionsRepository: DrizzleDocumentVersionsRepository

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(
      ReviewCaseDocumentVersionController,
      (builder) => builder,
      [DocumentProductionDatabaseModule],
    )
    versionsRepository = fixture.app.get(DrizzleDocumentVersionsRepository)
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('stores the reviewer decision and comments in the reviewed version', async () => {
    const reviewer = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: reviewer.clientId,
      legalAreaId: reviewer.legalAreaId,
      legalTopicId: reviewer.legalTopicId,
    })
    await fixture.registerCaseMembers([
      {
        caseId: legalCase.id,
        collaboratorId: reviewer.collaboratorId,
        role: CaseMemberRole.Collaborator,
      },
    ])

    const documentId = '20000000-0000-4000-8000-000000000001'
    const version = await versionsRepository.add(
      DocumentVersionFaker.fake({
        documentId,
        documentGenerationId: undefined,
        createdByCollaboratorId: '30000000-0000-4000-8000-000000000001',
        status: 'in_review',
      }),
    )

    const response = await request(fixture.app.getHttpServer())
      .patch(
        `/cases/${legalCase.id}/documents/${documentId}/versions/${version.id}/review`,
      )
      .send({ decision: 'rejected', rejectionReason: 'Revise a fundamentação.' })
      .expect(200)

    expect(response.body).toMatchObject({
      id: version.id,
      status: 'rejected',
      reviewedByCollaboratorId: reviewer.collaboratorId,
      rejectionReason: 'Revise a fundamentação.',
    })
    expect(await versionsRepository.findById(version.id)).toMatchObject({
      status: 'rejected',
      reviewedByCollaboratorId: reviewer.collaboratorId,
      rejectionReason: 'Revise a fundamentação.',
    })
  })

  it('denies the creator from reviewing their own version without changing it', async () => {
    const creator = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: creator.clientId,
      legalAreaId: creator.legalAreaId,
      legalTopicId: creator.legalTopicId,
    })
    await fixture.registerCaseMembers([
      {
        caseId: legalCase.id,
        collaboratorId: creator.collaboratorId,
        role: CaseMemberRole.Collaborator,
      },
    ])

    const documentId = '20000000-0000-4000-8000-000000000002'
    const version = await versionsRepository.add(
      DocumentVersionFaker.fake({
        documentId,
        documentGenerationId: undefined,
        createdByCollaboratorId: creator.collaboratorId,
        status: 'in_review',
      }),
    )

    await request(fixture.app.getHttpServer())
      .patch(
        `/cases/${legalCase.id}/documents/${documentId}/versions/${version.id}/review`,
      )
      .send({ decision: 'approved' })
      .expect(403)

    expect(await versionsRepository.findById(version.id)).toMatchObject({
      status: 'in_review',
      reviewedByCollaboratorId: undefined,
      rejectionReason: undefined,
    })
  })
})
