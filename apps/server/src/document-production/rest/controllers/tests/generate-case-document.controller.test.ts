import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { randomUUID } from 'node:crypto'
import { DocumentProductionModuleFixture } from '@/document-production/fixtures'
import { GenerateCaseDocumentController } from '@/document-production/rest/controllers'

describe('Generate Case Document Controller', () => {
  let fixture: DocumentProductionModuleFixture
  beforeAll(async () => {
    fixture = await DocumentProductionModuleFixture.register(
      GenerateCaseDocumentController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('rejects generation outside the case team before publishing a job', async () => {
    const lawyer = await fixture.registerLawyer()
    const legalCase = await fixture.createCase(lawyer, false)
    await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/documents/generations`)
      .set('Authorization', fixture.authenticateAs(lawyer))
      .send({ documentSpecificationId: randomUUID(), documentFileIds: [randomUUID()] })
      .expect(403)
  })

  it('denies administrators and ineligible team members before generation, retry, or revision effects', async () => {
    const admin = await fixture.registerAdmin()
    const adminCase = await fixture.createCase(admin)
    await expectGenerationRoutesDenied(adminCase.id, fixture.authenticateAs(admin))

    const lawyer = await fixture.registerLawyer()
    const lawyerCase = await fixture.createCase(lawyer)
    await fixture.setCollaboratorProfile(lawyer, 'attendant')
    await expectGenerationRoutesDenied(lawyerCase.id, fixture.authenticateAs(lawyer))

    async function expectGenerationRoutesDenied(caseId: string, authorization: string) {
      await request(fixture.app.getHttpServer())
        .post(`/cases/${caseId}/documents/generations`)
        .set('Authorization', authorization)
        .send({ documentSpecificationId: randomUUID(), documentFileIds: [randomUUID()] })
        .expect(403)
      const documentId = randomUUID()
      await request(fixture.app.getHttpServer())
        .post(`/cases/${caseId}/documents/${documentId}/generations/retry`)
        .set('Authorization', authorization)
        .expect(403)
      await request(fixture.app.getHttpServer())
        .post(
          `/cases/${caseId}/documents/${documentId}/versions/${randomUUID()}/generations`,
        )
        .set('Authorization', authorization)
        .send({ instructions: 'Revisar a redação da peça.' })
        .expect(403)
      await expect(
        fixture.packagesRepository.findByContext({ type: 'case', caseId }),
      ).resolves.toBeUndefined()
    }
  })
})
